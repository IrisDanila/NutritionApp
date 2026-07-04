import {NativeModules, PermissionsAndroid, Platform} from 'react-native';

const {NutriStepCounter} = NativeModules;

export async function isStepSensorAvailable(): Promise<boolean> {
  if (Platform.OS !== 'android' || !NutriStepCounter) return false;
  try {
    return await NutriStepCounter.isAvailable();
  } catch {
    return false;
  }
}

export async function ensureStepPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  // ACTIVITY_RECOGNITION is only required on Android 10+ (API 29+).
  if (typeof Platform.Version === 'number' && Platform.Version < 29) return true;
  try {
    const perm = PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION;
    if (await PermissionsAndroid.check(perm)) return true;
    const res = await PermissionsAndroid.request(perm, {
      title: 'Activity recognition',
      message: 'NutriLife uses your step counter to track daily steps.',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
    });
    return res === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

/** Cumulative steps since device boot, or null if unavailable. */
export async function readCumulativeSteps(): Promise<number | null> {
  if (!NutriStepCounter) return null;
  try {
    return await NutriStepCounter.getCumulativeSteps();
  } catch {
    return null;
  }
}
