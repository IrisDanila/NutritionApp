# NutriLife — Practical Application Deliverables

**Student:** Dănilă Iris-Daniela
**Coordinator:** As. Drd. Ing. Ionuț Grigore
**Faculty:** Universitatea Politehnica Timișoara — Automatică și Calculatoare
**Application:** NutriLife — Aplicație Mobilă pentru Nutriție, Fitness și Bunăstare cu Inteligență Artificială On-Device

---

## 1. Repository

- **Link:** [https://github.com/IrisDanila/NutritionApp](https://github.com/IrisDanila/NutritionApp)
- **Visibility:** Public
- **Contents:** the entire source code of the application (`src/`, `android/`, `scripts/`, configuration files, documentation), **without compiled binaries** (no `.apk` output, `build/` directories, `node_modules/`, or the Gradle wrapper binary jar — these are excluded from version control).

> **Note on AI model files:** the two ONNX models used by the application
> (the Food-101 EfficientNet-B0 classifier and the SmolLM2-360M-Instruct language model,
> ~270 MB) live under `./models` and must be staged into the Android project before
> building (see Section 2, step 3). The SmolLM2 tokenizer (`tokenizer.json`) is fetched
> separately at setup time rather than committed to the repository.

---

## 2. Application Build Steps

### 2.1 Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18 |
| JDK | 17 |
| Android Studio + Android SDK | Platform 34, Build-Tools 34 |
| Android NDK | 26.1.x |
| A device/emulator | Android API 24+, ideally ≥ 4 GB RAM (the on-device LLM is heavy) |

### 2.2 Clone the repository

```bash
git clone https://github.com/IrisDanila/NutritionApp.git
cd NutritionApp
```

### 2.3 Install JavaScript dependencies

```bash
npm install
```

> This project intentionally ships **no `node_modules`**; exact versions are pinned in
> `package.json`.

### 2.4 Stage the AI models and tokenizer

The two `.onnx` files live in `./models`. Copy them into the Android assets and fetch the
tokenizer:

```bash
node scripts/copy-models.js       # models/*.onnx  -> android assets
node scripts/fetch-tokenizer.js   # downloads SmolLM2 tokenizer.json
```

If the network blocks Hugging Face, download `tokenizer.json` manually from
`https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct/resolve/main/tokenizer.json`
and place it at `android/app/src/main/assets/tokenizer/tokenizer.json`.

### 2.5 Generate the Gradle wrapper jar (one-time)

The binary `android/gradle/wrapper/gradle-wrapper.jar` is not committed to the repository
(it cannot be stored as text). Generate it once, using either option:

- open the `android/` folder in **Android Studio** — it sets up the wrapper automatically, or
- if Gradle is installed locally:

  ```bash
  cd android
  gradle wrapper --gradle-version 8.8
  ```

### 2.6 Build

**Debug build (development):**

```bash
npm start            # terminal 1: Metro bundler
npm run android      # terminal 2: build + install the debug app
```

**Debug APK, built directly:**

```bash
npm run build:android   # -> android/app/build/outputs/apk/release/app-release.apk
```

> The resulting APK is ~**290 MB** because the SmolLM2 language model (~270 MB) is
> bundled for fully offline inference. This is expected.

---

## 3. Application Installation and Launch Steps

### 3.1 From a debug build (development machine + connected device/emulator)

```bash
npm start          # terminal 1: Metro bundler
npm run android     # terminal 2: build, install and launch on the device/emulator
```

### 3.2 From a built APK (any Android device, API 24+)

1. Build the APK as described in Section 2.6, or obtain a pre-built
   `app-release.apk`.
2. Enable **installation from unknown sources** on the target device (not required if
   installing through a store).
3. Install the APK via `adb`:

   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

   or copy the APK to the device and open it directly.
4. Launch the app from the device's app drawer — icon **NutriLife**.

### 3.3 First run

On first launch, the app shows the onboarding screen (name, sex, age, height, weight,
activity level, goal) used to compute daily nutrition targets. All data is then persisted
locally on the device (AsyncStorage) — there is no account and no cloud backend.

---

## 4. Notes

- The application targets **Android** only (bare React Native, no Expo); there is no iOS
  project in this repository.
- Both AI models — **EfficientNet-B0** (Food-101 food recognition) and **SmolLM2-360M-Instruct**
  (on-device nutrition/fitness coach) — run **fully on-device** via ONNX Runtime; no
  server-side component is required to run or build the application. Nutrition lookups use
  the public **USDA FoodData Central** API, and recipes use **TheMealDB** API.
