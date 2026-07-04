/**
 * The "AI Coach" orchestration layer.
 *
 * Builds a context-aware chat prompt from the user's profile + today's intake,
 * runs the on-device SmolLM2 model, and degrades gracefully to a rule-based
 * responder when the model/tokenizer aren't available or the user disabled AI.
 */
import {generate, getTokenizer} from './onnx/llm';
import {
  COACH_MODEL_ASSET,
  TOKENIZER_ASSET,
  isModelBundled,
} from './onnx/modelManager';
import {DayTotals} from './nutrition';
import {NutritionTargets, Profile} from '../store/types';
import {round} from '../utils/math';

export interface CoachContext {
  profile: Profile | null;
  targets: NutritionTargets | null;
  consumed: DayTotals;
  waterMl: number;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

const PERSONA =
  'You are Nutri, a friendly, concise nutrition and wellness coach inside a ' +
  'mobile app. Give practical, encouraging, science-based advice. Keep ' +
  'answers short (2-5 sentences) unless asked for detail. Never give medical ' +
  'diagnoses; suggest seeing a professional for medical concerns.';

function contextBlock(ctx: CoachContext): string {
  if (!ctx.profile || !ctx.targets) return '';
  const t = ctx.targets;
  const c = ctx.consumed;
  const remaining = Math.max(0, t.calories - c.calories);
  return [
    `User profile: ${ctx.profile.name || 'the user'}, goal = ${ctx.profile.goal}.`,
    `Daily targets: ${t.calories} kcal, ${t.protein}g protein, ${t.carbs}g carbs, ${t.fat}g fat, ${t.waterMl}ml water.`,
    `Eaten so far today: ${round(c.calories)} kcal (${round(c.protein)}g P / ${round(c.carbs)}g C / ${round(c.fat)}g F), ${remaining} kcal remaining.`,
    `Water today: ${ctx.waterMl}ml of ${t.waterMl}ml.`,
  ].join(' ');
}

let availabilityCache: boolean | null = null;

export async function isCoachAvailable(): Promise<boolean> {
  if (availabilityCache !== null) return availabilityCache;
  try {
    const [model, tok] = await Promise.all([
      isModelBundled(COACH_MODEL_ASSET),
      isModelBundled(TOKENIZER_ASSET),
    ]);
    availabilityCache = model && tok;
  } catch {
    availabilityCache = false;
  }
  return availabilityCache;
}

export interface CoachReplyHandlers {
  onToken?: (text: string) => void;
  shouldStop?: () => boolean;
}

/**
 * Produce a reply for the latest user message given prior turns + live context.
 */
export async function coachReply(
  history: ChatTurn[],
  ctx: CoachContext,
  handlers: CoachReplyHandlers = {},
): Promise<{text: string; usedAI: boolean}> {
  const available = await isCoachAvailable();
  if (!available) {
    return {text: ruleBasedReply(history, ctx), usedAI: false};
  }

  try {
    const tok = await getTokenizer();
    const imStart = tok.specialId('<|im_start|>');
    const imEnd = tok.specialId('<|im_end|>');
    const eot = tok.specialId('<|endoftext|>');

    if (imStart === undefined || imEnd === undefined) {
      return {text: ruleBasedReply(history, ctx), usedAI: false};
    }

    const system = `${PERSONA}\n\n${contextBlock(ctx)}`.trim();

    // Build chat-template token ids:  <|im_start|>role\n{content}<|im_end|>\n ...
    const ids: number[] = [];
    const push = (role: string, content: string) => {
      ids.push(imStart);
      ids.push(...tok.encode(`${role}\n${content}`));
      ids.push(imEnd);
      ids.push(...tok.encode('\n'));
    };

    push('system', system);
    // Keep the last few turns to stay within a sensible context window.
    for (const turn of history.slice(-6)) push(turn.role, turn.content);
    // Open the assistant turn.
    ids.push(imStart);
    ids.push(...tok.encode('assistant\n'));

    const stopIds = [imEnd, ...(eot !== undefined ? [eot] : [])];

    const text = await generate(ids, stopIds, {
      maxNewTokens: 240,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      repetitionPenalty: 1.15,
      onToken: handlers.onToken,
      shouldStop: handlers.shouldStop,
    });

    const cleaned = cleanup(text);
    return {
      text: cleaned || ruleBasedReply(history, ctx),
      usedAI: cleaned.length > 0,
    };
  } catch {
    return {text: ruleBasedReply(history, ctx), usedAI: false};
  }
}

function cleanup(text: string): string {
  return text
    .replace(/<\|im_end\|>/g, '')
    .replace(/<\|im_start\|>/g, '')
    .replace(/<\|endoftext\|>/g, '')
    .trim();
}

/* ------------------------------------------------------------------ */
/* Rule-based fallback coach                                           */
/* ------------------------------------------------------------------ */

const STARTER_TIPS = [
  'Aim to fill half your plate with vegetables — they add volume and fibre for very few calories.',
  'Protein at every meal keeps you full and protects muscle. Eggs, Greek yogurt, tofu, chicken and legumes are great picks.',
  'Hydration first: a glass of water before meals often curbs unnecessary snacking.',
  'Sleep is a nutrition tool too — poor sleep raises hunger hormones the next day.',
];

export function ruleBasedReply(history: ChatTurn[], ctx: CoachContext): string {
  const last = [...history].reverse().find(t => t.role === 'user');
  const q = (last?.content ?? '').toLowerCase();
  const t = ctx.targets;
  const c = ctx.consumed;

  const remaining = t ? Math.max(0, t.calories - c.calories) : 0;
  const proteinLeft = t ? Math.max(0, Math.round(t.protein - c.protein)) : 0;
  const waterLeft = t ? Math.max(0, t.waterMl - ctx.waterMl) : 0;

  if (/water|hydrat|drink/.test(q)) {
    return t
      ? `You've had ${ctx.waterMl}ml today — about ${waterLeft}ml to go to reach ${t.waterMl}ml. Keep a bottle nearby and sip regularly. 💧`
      : 'Try to drink water steadily through the day rather than all at once. 💧';
  }
  if (/protein/.test(q)) {
    return t
      ? `You have roughly ${proteinLeft}g of protein left for today. Easy wins: Greek yogurt (~17g), a chicken breast (~30g), or a scoop of whey (~24g).`
      : 'Spread protein across meals — most people do well around 1.6g per kg of bodyweight when active.';
  }
  if (/calorie|how much.*eat|left|remaining|budget/.test(q)) {
    return t
      ? `You've eaten ${Math.round(c.calories)} kcal, leaving about ${remaining} kcal for the rest of the day. A balanced plate of protein, veg and whole grains fits nicely.`
      : 'Set up your profile so I can tailor your calorie budget!';
  }
  if (/lose|weight loss|fat loss|cut/.test(q)) {
    return 'Sustainable fat loss is ~0.5kg/week: a modest deficit, plenty of protein, strength training, and steps. Small consistent habits beat extreme diets.';
  }
  if (/muscle|gain|bulk/.test(q)) {
    return 'To build muscle: a slight calorie surplus, ~1.6–2.2g protein/kg, progressive strength training, and good sleep. Patience pays off.';
  }
  if (/breakfast|lunch|dinner|snack|meal|recipe|cook|eat/.test(q)) {
    return 'A reliable template: a palm of protein, a fist of whole grains, two fists of veg, and a thumb of healthy fat. Want ideas for a specific meal?';
  }
  if (/stress|sleep|tired|anxious|calm|meditat/.test(q)) {
    return 'Stress and sleep shape appetite. Try the in-app breathing session, aim for 7–9h sleep, and keep caffeine before noon. 🧘';
  }
  if (/hi|hello|hey|start/.test(q) || q.length === 0) {
    return `Hi${ctx.profile?.name ? ' ' + ctx.profile.name : ''}! I'm Nutri, your coach. ${STARTER_TIPS[Math.floor(Math.random() * STARTER_TIPS.length)]} Ask me anything about your meals, macros, or habits.`;
  }
  return `Great question! In general: prioritise whole foods, enough protein, fibre, and hydration, and stay consistent. ${STARTER_TIPS[Math.floor(Math.random() * STARTER_TIPS.length)]}`;
}

/** Quick-prompt chips shown in the Coach UI. */
export const COACH_SUGGESTIONS = [
  'What should I eat for dinner?',
  'How much protein do I have left?',
  'Tips to hit my water goal',
  'A healthy high-protein snack',
  'How do I lose fat sustainably?',
];
