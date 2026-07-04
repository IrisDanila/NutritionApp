import {NativeModules, PermissionsAndroid, Platform} from 'react-native';
import {Settings} from '../store/types';

const {NutriReminders} = NativeModules;

export async function ensureNotifPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  // POST_NOTIFICATIONS only needs requesting on Android 13+ (API 33+).
  if (typeof Platform.Version === 'number' && Platform.Version < 33) return true;
  try {
    const perm = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
    if (await PermissionsAndroid.check(perm)) return true;
    const res = await PermissionsAndroid.request(perm);
    return res === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

/**
 * Cancels all reminders, then re-schedules according to the current settings.
 * Call on app start and whenever reminder settings change.
 */
export async function syncReminders(settings: Settings): Promise<void> {
  if (Platform.OS !== 'android' || !NutriReminders) return;
  try {
    await NutriReminders.cancelAll();
  } catch {
    // ignore
  }

  const wantsAny =
    settings.reminderWaterEnabled ||
    settings.reminderMealsEnabled ||
    settings.reminderQuestEnabled;
  if (!wantsAny) return;

  if (!(await ensureNotifPermission())) return;

  if (settings.reminderWaterEnabled) {
    NutriReminders.scheduleWater(settings.reminderWaterIntervalMin);
  }
  if (settings.reminderMealsEnabled) {
    NutriReminders.scheduleDaily(2001, 8, 0, 'Breakfast time 🍳', 'Log your breakfast in NutriLife.');
    NutriReminders.scheduleDaily(2002, 13, 0, 'Lunch time 🥗', "Don't forget to log your lunch.");
    NutriReminders.scheduleDaily(2003, 19, 0, 'Dinner time 🍽️', 'Log your dinner and check your macros.');
  }
  if (settings.reminderQuestEnabled) {
    NutriReminders.scheduleDaily(3001, 9, 0, 'New daily quests! 🎯', 'Fresh challenges are waiting — earn XP today.');
  }
}
