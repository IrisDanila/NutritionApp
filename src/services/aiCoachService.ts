import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { Gpt2BpeTokenizer } from '../utils/gpt2BpeTokenizer';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

const COACH_SYSTEM_PROMPT = `You are an expert nutrition and fitness coach. Provide concise, evidence-based advice about:
- Healthy eating and meal planning
- Exercise routines and fitness goals
- Weight management strategies
- Hydration and nutrition timing
- Supplements and vitamins
- Recovery and rest

Keep responses under 100 words. Be encouraging and supportive. Always recommend consulting healthcare professionals for medical concerns.`;

const KEYS = {
  CHAT_HISTORY: 'ai_coach_history',
};

const MODEL_FILES = {
  MODEL: 'model_q4f16.onnx',
  VOCAB: 'vocab.json',
  MERGES: 'merges.txt',
  TOKENIZER_JSON: 'tokenizer.json',
  TOKENIZER_CONFIG: 'tokenizer_config.json',
  SPECIAL_TOKENS_MAP: 'special_tokens_map.json',
};

const DEFAULT_EOS_TOKEN_ID = 2;
const MAX_CONTEXT_TOKENS = 256;
const MAX_NEW_TOKENS = 120;
const MAX_GENERATION_MS = 45000;
const MIN_GENERATED_TOKENS = 1;
const MIN_RESPONSE_WORDS = 1;

class AICoachService {
  private isInitialized = false;
  private session: InferenceSession | null = null;
  private tokenizer: Gpt2BpeTokenizer | null = null;
  private eosTokenId = DEFAULT_EOS_TOKEN_ID;

  private resolveBundlePath(fileName: string): string {
    return `models/${fileName}`;
  }

  private resolveDocumentPath(fileName: string): string {
    return `${RNFS.DocumentDirectoryPath}/${fileName}`;
  }

  private async prepareModelFiles(): Promise<{
    modelPath: string;
    vocabPath: string;
    mergesPath: string;
    tokenizerJsonPath: string;
    tokenizerConfigPath: string;
    specialTokensMapPath: string;
  }> {
    if (Platform.OS === 'android') {
      const files = [
        MODEL_FILES.MODEL,
        MODEL_FILES.VOCAB,
        MODEL_FILES.MERGES,
        MODEL_FILES.TOKENIZER_JSON,
        MODEL_FILES.TOKENIZER_CONFIG,
        MODEL_FILES.SPECIAL_TOKENS_MAP,
      ];
      for (const fileName of files) {
        const target = this.resolveDocumentPath(fileName);
        // Keep model/tokenizer files in sync with bundled assets.
        const shouldForceRefresh =
          fileName === MODEL_FILES.MODEL ||
          fileName === MODEL_FILES.VOCAB ||
          fileName === MODEL_FILES.MERGES ||
          fileName === MODEL_FILES.TOKENIZER_JSON ||
          fileName === MODEL_FILES.TOKENIZER_CONFIG ||
          fileName === MODEL_FILES.SPECIAL_TOKENS_MAP;

        if (shouldForceRefresh) {
          if (await RNFS.exists(target)) {
            await RNFS.unlink(target);
          }
          await RNFS.copyFileAssets(this.resolveBundlePath(fileName), target);
          continue;
        }

        const exists = await RNFS.exists(target);
        if (!exists) {
          await RNFS.copyFileAssets(this.resolveBundlePath(fileName), target);
        } else {
          // Re-copy if file looks corrupted or empty.
          const stat = await RNFS.stat(target);
          if (stat.size < 64) {
            await RNFS.unlink(target);
            await RNFS.copyFileAssets(this.resolveBundlePath(fileName), target);
          }
        }
      }

      return {
        modelPath: this.resolveDocumentPath(MODEL_FILES.MODEL),
        vocabPath: this.resolveDocumentPath(MODEL_FILES.VOCAB),
        mergesPath: this.resolveDocumentPath(MODEL_FILES.MERGES),
        tokenizerJsonPath: this.resolveDocumentPath(MODEL_FILES.TOKENIZER_JSON),
        tokenizerConfigPath: this.resolveDocumentPath(MODEL_FILES.TOKENIZER_CONFIG),
        specialTokensMapPath: this.resolveDocumentPath(MODEL_FILES.SPECIAL_TOKENS_MAP),
      };
    }

    const base = `${RNFS.MainBundlePath}/assets/models`;
    return {
      modelPath: `${base}/${MODEL_FILES.MODEL}`,
      vocabPath: `${base}/${MODEL_FILES.VOCAB}`,
      mergesPath: `${base}/${MODEL_FILES.MERGES}`,
      tokenizerJsonPath: `${base}/${MODEL_FILES.TOKENIZER_JSON}`,
      tokenizerConfigPath: `${base}/${MODEL_FILES.TOKENIZER_CONFIG}`,
      specialTokensMapPath: `${base}/${MODEL_FILES.SPECIAL_TOKENS_MAP}`,
    };
  }

  private async createCoachSession(modelPath: string): Promise<InferenceSession> {
    try {
      return await InferenceSession.create(modelPath, {
        executionProviders: ['cpu'],
        graphOptimizationLevel: 'disabled',
        executionMode: 'sequential',
        enableCpuMemArena: false,
        enableMemPattern: false,
        logSeverityLevel: 0,
      });
    } catch (firstError) {
      console.warn('ONNX coach session init (conservative mode) failed, retrying default mode:', firstError);
      return InferenceSession.create(modelPath);
    }
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      const {
        modelPath,
        mergesPath,
        tokenizerJsonPath,
        tokenizerConfigPath,
        specialTokensMapPath,
      } = await this.prepareModelFiles();

      const [mergesText, tokenizerJsonText, tokenizerConfigText, specialTokensMapText] = await Promise.all([
        RNFS.readFile(mergesPath, 'utf8'),
        RNFS.readFile(tokenizerJsonPath, 'utf8'),
        RNFS.readFile(tokenizerConfigPath, 'utf8'),
        RNFS.readFile(specialTokensMapPath, 'utf8'),
      ]);

      this.tokenizer = Gpt2BpeTokenizer.fromHuggingFaceAssets({
        tokenizerJson: JSON.parse(tokenizerJsonText),
        tokenizerConfig: JSON.parse(tokenizerConfigText),
        specialTokensMap: JSON.parse(specialTokensMapText),
        mergesTxt: mergesText,
      });

      this.eosTokenId = this.tokenizer.getEosTokenId() ?? DEFAULT_EOS_TOKEN_ID;
      this.session = await this.createCoachSession(modelPath);

      console.log('AI Coach ONNX model loaded:', modelPath);
      console.log('AI Coach tokenizer EOS token id:', this.eosTokenId);
      console.log('Coach model inputs:', this.session.inputNames);
      console.log('Coach model outputs:', this.session.outputNames);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize ONNX coach model, using fallback mode:', error);
      this.tokenizer = null;
      this.session = null;
      this.eosTokenId = DEFAULT_EOS_TOKEN_ID;
      this.isInitialized = true;
    }
  }

  private createIntTensor(tokens: number[], dims: number[]): Tensor {
    try {
      return new Tensor('int64', BigInt64Array.from(tokens.map(t => BigInt(t))), dims);
    } catch {
      return new Tensor('int32', Int32Array.from(tokens), dims);
    }
  }

  private createZeroTensorFromMetadata(meta: any, seqLen: number): Tensor | null {
    if (!meta || !meta.isTensor || !Array.isArray(meta.shape)) {
      return null;
    }

    const isPastKv = /^past_key_values\.\d+\.(key|value)$/.test(meta.name ?? '');

    const dims = (meta.shape as Array<number | string>).map((dim, index) => {
      if (typeof dim === 'number') {
        if (dim > 0) {
          return dim;
        }
        if (isPastKv && index === 2) {
          return 0;
        }
        return 1;
      }

      const symbol = String(dim).toLowerCase();
      if (isPastKv && index === 2) {
        return 0;
      }
      if (symbol.includes('seq') || symbol.includes('position') || symbol.includes('length')) {
        return seqLen;
      }
      if (symbol.includes('past') || symbol.includes('cache')) {
        return 0;
      }
      return 1;
    });

    const size = dims.reduce((a, b) => a * Math.max(0, b), 1);
    const type = String(meta.type ?? 'float32');

    if (type === 'int64') {
      return new Tensor('int64', new BigInt64Array(size), dims);
    }
    if (type === 'int32') {
      return new Tensor('int32', new Int32Array(size), dims);
    }
    if (type === 'bool') {
      return new Tensor('bool', new Uint8Array(size), dims);
    }
    if (type === 'float16') {
      return new Tensor('float16', new Uint16Array(size), dims);
    }

    return new Tensor('float32', new Float32Array(size), dims);
  }

  private createBoolTensor(value: boolean, meta?: any): Tensor {
    if (meta?.isTensor && Array.isArray(meta.shape) && meta.shape.length === 0) {
      return new Tensor('bool', new Uint8Array([value ? 1 : 0]), []);
    }
    return new Tensor('bool', new Uint8Array([value ? 1 : 0]), [1]);
  }

  private mapPresentToPastName(name: string): string {
    if (name.startsWith('present.')) {
      return name.replace(/^present\./, 'past_key_values.');
    }
    if (name.startsWith('present_key_values.')) {
      return name.replace(/^present_key_values\./, 'past_key_values.');
    }
    return name;
  }

  private extractPastFromOutputs(outputs: Record<string, any>): Record<string, Tensor> {
    const cache: Record<string, Tensor> = {};
    for (const [name, value] of Object.entries(outputs)) {
      if (
        name.startsWith('present.') ||
        name.startsWith('present_key_values.') ||
        /^past_key_values\.\d+\.(key|value)$/.test(name)
      ) {
        cache[this.mapPresentToPastName(name)] = value as Tensor;
      }
    }
    return cache;
  }

  private buildFeedsForStep(params: {
    fullSequence: number[];
    step: number;
    lastToken: number;
    pastCache: Record<string, Tensor>;
    invertUseCacheBranch: boolean;
  }): Record<string, Tensor> {
    if (!this.session) {
      return {};
    }

    const { fullSequence, step, lastToken, pastCache, invertUseCacheBranch } = params;
    const totalSeqLen = fullSequence.length;
    const isFirstStep = step === 0;
    const currentInputIds = isFirstStep ? fullSequence : [lastToken];
    const currentSeqLen = currentInputIds.length;

    const feeds: Record<string, Tensor> = {};
    const inputNames = this.session.inputNames;
    const inputMetadata = this.session.inputMetadata as any[];

    if (inputNames.includes('input_ids')) {
      feeds.input_ids = this.createIntTensor(currentInputIds, [1, currentSeqLen]);
    }
    if (inputNames.includes('attention_mask')) {
      feeds.attention_mask = this.createIntTensor(new Array(totalSeqLen).fill(1), [1, totalSeqLen]);
    }
    if (inputNames.includes('position_ids')) {
      if (isFirstStep) {
        const pos = new Array(totalSeqLen).fill(0).map((_, i) => i);
        feeds.position_ids = this.createIntTensor(pos, [1, totalSeqLen]);
      } else {
        feeds.position_ids = this.createIntTensor([totalSeqLen - 1], [1, 1]);
      }
    }
    if (inputNames.includes('cache_position')) {
      if (isFirstStep) {
        const cachePos = new Array(totalSeqLen).fill(0).map((_, i) => i);
        feeds.cache_position = this.createIntTensor(cachePos, [totalSeqLen]);
      } else {
        feeds.cache_position = this.createIntTensor([Math.max(0, totalSeqLen - 1)], [1]);
      }
    }
    if (inputNames.includes('past_key_values_length')) {
      feeds.past_key_values_length = this.createIntTensor([Math.max(0, totalSeqLen - currentSeqLen)], [1]);
    }

    for (const inputName of inputNames) {
      if (feeds[inputName]) {
        continue;
      }

      if (inputName === 'use_cache_branch') {
        const meta = inputMetadata.find(m => m.name === inputName);
        const useCacheValue = invertUseCacheBranch ? isFirstStep : !isFirstStep;
        feeds[inputName] = this.createBoolTensor(useCacheValue, meta);
        continue;
      }

      if (/^past_key_values\.\d+\.(key|value)$/.test(inputName)) {
        if (pastCache[inputName]) {
          feeds[inputName] = pastCache[inputName];
          continue;
        }

        const meta = inputMetadata.find(m => m.name === inputName);
        const zero = this.createZeroTensorFromMetadata(meta, totalSeqLen);
        if (zero) {
          feeds[inputName] = zero;
        }
        continue;
      }

      // Do not synthesize unknown inputs; wrong placeholder values can degrade or stall decoding.
    }

    return feeds;
  }

  private buildPrompt(userMessage: string, history: Message[]): string {
    const recentTurns = history
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-6)
      .map(m => `<|im_start|>${m.role}\n${m.content}<|im_end|>\n`)
      .join('');

    return (
      `<|im_start|>system\n${COACH_SYSTEM_PROMPT}<|im_end|>\n` +
      recentTurns +
      `<|im_start|>user\n${userMessage}<|im_end|>\n` +
      `<|im_start|>assistant\n`
    );
  }

  private pickArgmax(logits: Float32Array | number[]): number {
    let maxIndex = 0;
    let maxValue = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < logits.length; i += 1) {
      if (logits[i] > maxValue) {
        maxValue = logits[i];
        maxIndex = i;
      }
    }
    return maxIndex;
  }

  private pickArgmaxWithBan(logits: Float32Array | number[], banned: Set<number>): number {
    let maxIndex = 0;
    let maxValue = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < logits.length; i += 1) {
      if (banned.has(i)) {
        continue;
      }
      if (logits[i] > maxValue) {
        maxValue = logits[i];
        maxIndex = i;
      }
    }

    return maxIndex;
  }

  private extractLogitsTensor(output: Record<string, Tensor>): Tensor | null {
    if (output.logits) {
      return output.logits as Tensor;
    }

    const candidates = Object.entries(output)
      .map(([name, value]) => ({ name, value: value as Tensor }))
      .filter(entry => Array.isArray(entry.value?.dims) && entry.value.dims.length >= 2)
      .sort((a, b) => {
        const aLogitsName = /logits?/i.test(a.name) ? 1 : 0;
        const bLogitsName = /logits?/i.test(b.name) ? 1 : 0;
        if (aLogitsName !== bLogitsName) {
          return bLogitsName - aLogitsName;
        }

        if (a.value.dims.length !== b.value.dims.length) {
          return b.value.dims.length - a.value.dims.length;
        }

        const aLastDim = a.value.dims[a.value.dims.length - 1] ?? 0;
        const bLastDim = b.value.dims[b.value.dims.length - 1] ?? 0;
        return bLastDim - aLastDim;
      });

    return candidates[0]?.value ?? null;
  }

  private async generateWithOnnx(
    prompt: string,
    onPartialText?: (text: string) => void,
  ): Promise<string | null> {
    if (!this.session || !this.tokenizer) {
      return null;
    }

    const encoded = this.tokenizer.encode(prompt);
    if (encoded.length === 0) {
      return null;
    }

    const runPass = async (invertUseCacheBranch: boolean): Promise<string | null> => {
      const inputIds = encoded.slice(-MAX_CONTEXT_TOKENS);
      const generated: number[] = [];
      const startedAt = Date.now();
      let pastCache: Record<string, Tensor> = {};
      let lastToken = inputIds[inputIds.length - 1] ?? this.eosTokenId;
      let lastEmittedText = '';

      for (let step = 0; step < MAX_NEW_TOKENS; step += 1) {
        if (Date.now() - startedAt > MAX_GENERATION_MS) {
          break;
        }

        const fullSequence = [...inputIds, ...generated].slice(-MAX_CONTEXT_TOKENS);
        const feeds = this.buildFeedsForStep({
          fullSequence,
          step,
          lastToken,
          pastCache,
          invertUseCacheBranch,
        });

        if (!feeds.input_ids) {
          return null;
        }

        const output = (await this.session!.run(feeds)) as Record<string, Tensor>;
        pastCache = this.extractPastFromOutputs(output as any);

        const logitsTensor = this.extractLogitsTensor(output);
        if (!logitsTensor || !Array.isArray(logitsTensor.dims) || logitsTensor.dims.length < 2) {
          return null;
        }

        const rank = logitsTensor.dims.length;
        const outSeqLen = rank >= 3 ? (logitsTensor.dims[1] ?? 1) : 1;
        const vocabSize = logitsTensor.dims[rank - 1] ?? 0;
        if (vocabSize <= 0) {
          return null;
        }

        const data = logitsTensor.data as Float32Array | number[];
        const start = (outSeqLen - 1) * vocabSize;
        const end = start + vocabSize;
        const nextLogits = (data as any).slice(start, end) as Float32Array | number[];

        const banned = new Set<number>();
        if (generated.length < 4) {
          banned.add(this.eosTokenId);
        }

        const nextToken = banned.size > 0
          ? this.pickArgmaxWithBan(nextLogits, banned)
          : this.pickArgmax(nextLogits);

        if (nextToken === this.eosTokenId) {
          if (generated.length < MIN_GENERATED_TOKENS) {
            return null;
          }
          break;
        }

        generated.push(nextToken);
        lastToken = nextToken;

        if (onPartialText) {
          const partial = this.tokenizer!.decode(generated);
          if (partial && partial !== lastEmittedText) {
            lastEmittedText = partial;
            onPartialText(partial);
          }
        }
      }

      const text = this.tokenizer!.decode(generated).trim();
      if (!text) {
        return null;
      }

      const wordCount = text.split(/\s+/).filter(Boolean).length;
      if (wordCount < MIN_RESPONSE_WORDS) {
        return null;
      }

      return text;
    };

    const firstPass = await runPass(false);
    if (firstPass) {
      return firstPass;
    }

    return runPass(true);
  }

  async askCoachStream(
    userMessage: string,
    options?: {
      onPartialText?: (text: string) => void;
    },
  ): Promise<string> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('Processing message:', userMessage);
      const history = await this.getChatHistory();
      const prompt = this.buildPrompt(userMessage, history);

      const modelResponse = await Promise.race<string | null>([
        this.generateWithOnnx(prompt, options?.onPartialText),
        new Promise<null>(resolve => setTimeout(() => resolve(null), MAX_GENERATION_MS + 2000)),
      ]);

      const response = modelResponse ?? this.getFallbackResponse(userMessage);

      await this.saveChatMessage({
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
      });
      await this.saveChatMessage({
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      });

      return response;
    } catch (error) {
      console.error('AI Coach error:', error);
      return this.getFallbackResponse(userMessage);
    }
  }


  async askCoach(userMessage: string): Promise<string> {
    return this.askCoachStream(userMessage);
  }

  async release() {
    this.session = null;
    this.tokenizer = null;
    this.isInitialized = false;
  }

  private getFallbackResponse(userMessage: string): string {
    const lower = userMessage.toLowerCase();
    
    if (lower.includes('protein')) {
      return 'Aim for 0.8-1g of protein per kg of body weight daily. Good sources include chicken, fish, eggs, legumes, and Greek yogurt. Spread intake throughout the day for optimal muscle synthesis.';
    }
    if (lower.includes('water') || lower.includes('hydrat')) {
      return 'Drink 2-3 liters of water daily. More if you exercise or it\'s hot. Good hydration improves performance, recovery, and helps with weight management. Carry a water bottle with you!';
    }
    if (lower.includes('weight') || lower.includes('lose') || lower.includes('fat')) {
      return 'For sustainable weight loss, aim for a 300-500 calorie deficit daily through diet and exercise. Focus on whole foods, adequate protein, and regular movement. Be patient - 0.5-1kg per week is ideal.';
    }
    if (lower.includes('exercise') || lower.includes('workout') || lower.includes('train')) {
      return 'Aim for 150 minutes of moderate exercise weekly. Mix cardio with strength training. Start with 3-4 days per week. Progressive overload and consistency are key. Rest days are essential for recovery.';
    }
    if (lower.includes('meal') || lower.includes('eat') || lower.includes('diet')) {
      return 'Focus on whole foods: lean proteins, vegetables, fruits, whole grains, and healthy fats. Eat 3-4 balanced meals daily. Prep meals in advance. Listen to your hunger cues and eat mindfully.';
    }
    if (lower.includes('muscle') || lower.includes('gain') || lower.includes('bulk')) {
      return 'To build muscle, consume 1.6-2.2g protein per kg body weight, eat in a slight calorie surplus, and focus on progressive resistance training 3-5x per week. Prioritize compound movements and adequate rest.';
    }
    if (lower.includes('cardio') || lower.includes('running') || lower.includes('endurance')) {
      return 'Mix steady-state cardio (30-45 min) with HIIT sessions (15-20 min) for optimal results. Start gradually and increase intensity over time. Don\'t forget to warm up and cool down properly.';
    }
    if (lower.includes('sleep') || lower.includes('rest') || lower.includes('recovery')) {
      return 'Aim for 7-9 hours of quality sleep nightly. Sleep is crucial for recovery, muscle growth, and hormone regulation. Maintain consistent sleep schedule, avoid screens before bed, and create a cool, dark environment.';
    }
    if (lower.includes('supplement') || lower.includes('vitamin')) {
      return 'Focus on whole foods first. Common useful supplements: protein powder, creatine, vitamin D, omega-3. Consult with a healthcare provider before starting any supplements, especially if you have health conditions.';
    }
    if (lower.includes('snack')) {
      return 'Healthy snack ideas: Greek yogurt with berries, nuts and seeds, apple with almond butter, hard-boiled eggs, hummus with veggies, or a protein shake. Keep snacks portioned and balanced.';
    }
    
    return 'Great question! I recommend focusing on balanced nutrition with whole foods, regular exercise, adequate sleep (7-9 hours), and staying hydrated. Track your progress and adjust as needed. What specific aspect would you like to discuss?';
  }

  async getChatHistory(): Promise<Message[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CHAT_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  }

  private async saveChatMessage(message: Message) {
    try {
      const history = await this.getChatHistory();
      history.push(message);
      // Keep only last 50 messages
      const trimmedHistory = history.slice(-50);
      await AsyncStorage.setItem(KEYS.CHAT_HISTORY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  }

  async clearHistory() {
    try {
      await AsyncStorage.removeItem(KEYS.CHAT_HISTORY);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  }
}

export const aiCoachService = new AICoachService();
