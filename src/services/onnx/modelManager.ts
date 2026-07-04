/**
 * Central place that owns the two ONNX Runtime sessions.
 *
 * Model weights ship inside the Android APK under `assets/models/`. ONNX
 * Runtime needs a real filesystem path (it mmaps the file), and Android assets
 * are not real files, so on first use we copy each model out to the app's
 * documents directory and create the session from there. Sessions are cached.
 */
import {InferenceSession} from 'onnxruntime-react-native';
import RNFS from 'react-native-fs';
import {Platform} from 'react-native';

export const FOOD_MODEL_ASSET = 'models/food_classifier.onnx';
export const COACH_MODEL_ASSET = 'models/coach_smollm2_360m_q4.onnx';
export const TOKENIZER_ASSET = 'tokenizer/tokenizer.json';

const MODELS_DIR = `${RNFS.DocumentDirectoryPath}/models`;

let foodSession: InferenceSession | null = null;
let coachSession: InferenceSession | null = null;
let foodPromise: Promise<InferenceSession> | null = null;
let coachPromise: Promise<InferenceSession> | null = null;

async function ensureCopied(assetPath: string): Promise<string> {
  const fileName = assetPath.split('/').pop() as string;
  const dest = `${MODELS_DIR}/${fileName}`;

  await RNFS.mkdir(MODELS_DIR);
  const exists = await RNFS.exists(dest);

  if (!exists) {
    if (Platform.OS === 'android') {
      // Reads from android/app/src/main/assets/<assetPath>
      await RNFS.copyFileAssets(assetPath, dest);
    } else {
      // iOS: bundled in main bundle (not the primary target here).
      const src = `${RNFS.MainBundlePath}/${assetPath}`;
      await RNFS.copyFile(src, dest);
    }
  }
  return dest;
}

export async function isModelBundled(assetPath: string): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      // readDirAssets throws if the directory is missing.
      const dir = assetPath.split('/').slice(0, -1).join('/');
      const file = assetPath.split('/').pop();
      const list = await RNFS.readDirAssets(dir);
      return list.some(f => f.name === file);
    }
    return await RNFS.exists(`${RNFS.MainBundlePath}/${assetPath}`);
  } catch {
    return false;
  }
}

const SESSION_OPTS: InferenceSession.SessionOptions = {
  executionProviders: ['cpu'],
  graphOptimizationLevel: 'all',
};

export async function getFoodSession(): Promise<InferenceSession> {
  if (foodSession) return foodSession;
  if (!foodPromise) {
    foodPromise = (async () => {
      const path = await ensureCopied(FOOD_MODEL_ASSET);
      const session = await InferenceSession.create(path, SESSION_OPTS);
      foodSession = session;
      return session;
    })();
  }
  return foodPromise;
}

export async function getCoachSession(): Promise<InferenceSession> {
  if (coachSession) return coachSession;
  if (!coachPromise) {
    coachPromise = (async () => {
      const path = await ensureCopied(COACH_MODEL_ASSET);
      const session = await InferenceSession.create(path, {
        ...SESSION_OPTS,
        // The LLM benefits from a couple of threads on mobile CPUs.
        intraOpNumThreads: 4,
      } as InferenceSession.SessionOptions);
      coachSession = session;
      return session;
    })();
  }
  return coachPromise;
}

export async function readTokenizerJson(): Promise<string> {
  if (Platform.OS === 'android') {
    return RNFS.readFileAssets(TOKENIZER_ASSET, 'utf8');
  }
  return RNFS.readFile(`${RNFS.MainBundlePath}/${TOKENIZER_ASSET}`, 'utf8');
}

export function disposeSessions() {
  foodSession?.release?.();
  coachSession?.release?.();
  foodSession = null;
  coachSession = null;
  foodPromise = null;
  coachPromise = null;
}
