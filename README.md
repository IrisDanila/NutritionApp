# 🥗 NutriLife 2.0

A bare **React Native** (no Expo) Android nutrition & wellness app that runs two
AI models **fully on-device** with ONNX Runtime, and pulls nutrition facts from
the **USDA FoodData Central** API.

- 📷 **AI Food Scanner** — MobileNetV2 fine-tuned on Food‑101 recognises a dish
  from a photo, then fetches its nutrition from USDA.
- 🤖 **AI Coach** — SmolLM2‑360M‑Instruct (q4f16) answers nutrition questions
  on-device, aware of your profile and today's intake. Falls back to a smart
  rule-based coach if the model isn't present.
- 📒 **Food diary** with meals, macros and a calorie ring.
- 🎮 **Gamification** — 3 seeded **daily challenges**, **XP & levels** with
  ranks, a **workout log**, and **30+ long-term achievements**.
- 💧 **Water tracker**, 🧘 **meditation / breathing**, ⚖️ **weight + BMI**,
  📈 **history & charts**, and a 🌗 **dark / light theme toggle**.

Everything is stored locally on the device (AsyncStorage). No account, no cloud.

---

## 1. Prerequisites (on your build machine)

- Node.js ≥ 18
- JDK 17
- Android Studio + Android SDK (Platform 34, Build-Tools 34, NDK 26.1.x)
- A device/emulator with **API 24+** and ideally ≥ 4 GB RAM (the LLM is heavy)

## 2. Install JS dependencies

```bash
npm install
```

> This project intentionally ships **no `node_modules`**. The exact versions are
> pinned in `package.json`.

## 3. Stage the AI models + tokenizer

The two `.onnx` files live in `./models`. Copy them into the Android assets and
fetch the tokenizer:

```bash
node scripts/copy-models.js       # models/*.onnx  -> android assets
node scripts/fetch-tokenizer.js   # downloads SmolLM2 tokenizer.json
```

If your network blocks Hugging Face, download `tokenizer.json` manually from
`https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct/resolve/main/tokenizer.json`
and drop it at `android/app/src/main/assets/tokenizer/tokenizer.json`.

## 4. Generate the Gradle wrapper jar (one-time)

The binary `android/gradle/wrapper/gradle-wrapper.jar` is **not** included (it
can't be checked in as text). Generate it once — any of these works:

- Open the `android/` folder in **Android Studio** → it will set up the wrapper
  automatically, **or**
- If you have Gradle installed: `cd android && gradle wrapper --gradle-version 8.8`

## 5. Run it

```bash
npm start            # terminal 1: Metro bundler
npm run android      # terminal 2: build + install the debug app
```

A debug APK can be built directly with:

```bash
npm run build:android   # android/app/build/outputs/apk/release/app-release.apk
```

> The release APK is ~**290 MB** because the SmolLM2 model (~270 MB) is bundled.
> That's expected for a fully offline LLM.

---

## How the AI models are used

### Food recognition (`src/services/onnx/foodModel.ts`)
1. Pick/take a photo (`react-native-image-picker`, resized to ≤512 px, base64).
2. `imagePreprocess.ts` decodes the JPEG (pure-JS `jpeg-js`), center-crops,
   bilinearly resizes to **224×224**, and normalises to `[-1, 1]` → `float32`
   NCHW tensor `[1,3,224,224]`.
3. ONNX Runtime runs MobileNetV2 → 101 logits → softmax → top-5.
4. Labels map to Food‑101 classes (`food101Labels.ts`); the chosen class is
   searched on USDA for real nutrition, then logged.

> ⚠️ Verify `FOOD101_LABELS` order matches your model's `config.json`
> `id2label`. It uses the canonical Hugging Face `food101` alphabetical order.

### AI Coach (`src/services/onnx/llm.ts`, `tokenizer.ts`, `coach.ts`)
- A self-contained **byte-level BPE tokenizer** reads `tokenizer.json`.
- Prompts use the SmolLM2 chat template (`<|im_start|>role … <|im_end|>`),
  injected with your goals + today's macros/water as system context.
- Autoregressive generation manages the **KV cache** (32 layers, 5 KV heads,
  head_dim 64) by shuttling `present.*` outputs back as `past_key_values.*`
  (fp16 tensors are passed straight through; only logits are read).
- Sampling: temperature + top-k + top-p + repetition penalty, streamed token by
  token into the chat UI.

If the model or tokenizer is missing, or the device can't run fp16, the coach
silently switches to a helpful **rule-based** responder so the app never breaks.

### Gamification (`src/services/{levels,challenges,achievements}.ts`)
- **XP & levels**: `levelInfo()` maps total XP to a level (gaps grow each level)
  and a **rank** (Sprout → Seedling → Grower → Achiever → Athlete → Champion →
  Legend), each with its own colour and emblem.
- **Daily challenges**: a pool of hand-written quests across hydration /
  nutrition / fitness / mind. `getDailyChallenges(date)` picks **3 per day**,
  seeded by the date (stable all day, fresh tomorrow), preferring distinct
  categories. *Auto* challenges tick off from tracked data (e.g. "drink 2 L",
  "hit protein", "30 min workout"); *manual* ones are tapped done. Completing a
  quest grants XP once (deduped per day in the store).
- **Workout log**: a lightweight gym/run/yoga/… logger feeds the fitness
  challenges and gym achievements.
- **Achievements**: 30+ tiered goals incl. *Iron Discipline* (gym on 90 days),
  *Two-Week Discipline* (under calories 14 days straight), *Centurion* (log 100
  days), meditation/water/level milestones, … Each unlock awards bonus XP.
- All XP claiming happens idempotently in `useGamification()`.

> **Assets**: rank emblems and badges are **self-generated SVG vector art**
> (`LevelBadge`, `LevelCard`) plus the bundled MaterialCommunityIcons set —
> deliberately **not** scraped images, so everything is license-clean and the
> app stays fully offline. Swap in raster art under `android/.../res` if desired.

### USDA FoodData Central (`src/services/usda.ts`)
- Free API; a working key is preconfigured (editable in **Settings**).
- Results are normalised to **per‑100 g** macros and scaled to your portion.

---

## Project structure

```
App.tsx                     providers + hydration gate
index.js                    entry
src/
  theme/                    palettes, ThemeProvider, typography
  store/                    zustand store (persisted) + domain types
  services/
    usda.ts                 USDA client
    nutrition.ts            BMR/TDEE/macros/BMI
    coach.ts                coach orchestration + fallback
    tips.ts                 offline daily tips
    levels.ts               XP curve + ranks
    challenges.ts           daily-quest pool + seeded picker
    achievements.ts         long-term achievement definitions
    onnx/                   modelManager, foodModel, imagePreprocess,
                            food101Labels, tokenizer, llm
  components/               Screen, Card, Button, ProgressRing, charts,
                            LevelBadge, LevelCard, ChallengeCard, …
  screens/                  Onboarding, Dashboard, Diary, Scan, Coach,
                            Water, Meditation, History, Weight, More,
                            Settings, Achievements, Challenges, FoodSearch,
                            FoodDetail
  navigation/               root stack + bottom tabs
  hooks/                    useNutrition (targets/totals/streak),
                            useGamification (XP, quests, achievements)
scripts/                    copy-models.js, fetch-tokenizer.js
android/                    native project (Kotlin, RN 0.74.5)
```

## Known limitations / notes

- **On-device LLM speed**: 360M params on a phone CPU generates a few tokens/sec.
  Responses are capped (~240 tokens) and streamed. Use a recent device.
- **float16 in ORT-RN**: KV-cache tensors are fp16. If a particular
  `onnxruntime-react-native` build rejects fp16 I/O, the coach falls back
  automatically; you can also export an fp32 model variant.
- App icon is a simple vector placeholder — replace `res/drawable/ic_launcher.xml`
  (or add proper mipmaps) for production.
- New Architecture (Fabric/TurboModules) is **off** for max library compatibility.

## License / data

Nutrition data © USDA FoodData Central. Models per their respective licenses
(MobileNetV2/Food‑101, SmolLM2 — Apache‑2.0).
