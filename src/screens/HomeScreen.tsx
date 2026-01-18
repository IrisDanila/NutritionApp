import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {storageService, Activity, DailyData, UserProfile} from '../services/storageService';
import {useTheme} from '../theme/ThemeContext';
import {
  accelerometer,
  SensorTypes,
  setUpdateIntervalForType,
} from 'react-native-sensors';
import {map} from 'rxjs/operators';

interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const HomeScreen = () => {
  const {colors} = useTheme();
  const navigation = useNavigation<any>();
  const [streak, setStreak] = useState(0);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [newActivity, setNewActivity] = useState({
    name: '',
    duration: '',
    caloriesBurned: '',
  });
  const [waterAmount, setWaterAmount] = useState('250');
  const [steps, setSteps] = useState(0);
  const [targetSteps, setTargetSteps] = useState(10000);
  const [notes, setNotes] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [calendarDays, setCalendarDays] = useState<
    {date: string; day: number; metGoals: boolean}[]
  >([]);
  const [calendarMonthLabel, setCalendarMonthLabel] = useState('');
  const stepsRef = useRef(0);
  const lastStepTimeRef = useRef(0);
  const lastPersistRef = useRef(0);

  const loadData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const data = await storageService.getDailyData(today);
    const currentStreak = await storageService.getStreak();
    const profile = await storageService.getUserProfile();
    setDailyData(data);
    setStreak(currentStreak);
    setSteps(data.steps);
    stepsRef.current = data.steps;
    setTargetSteps(profile.targetSteps || 10000);
    setProfile(profile);
    setNotes(data.notes);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getMealNutrition = (
    mealType: 'breakfast' | 'lunch' | 'dinner',
  ): NutritionSummary => {
    if (!dailyData) {
      return {calories: 0, protein: 0, carbs: 0, fat: 0};
    }

    const meals = dailyData.meals.filter(m => m.type === mealType);
    return meals.reduce(
      (acc, meal) => {
        meal.items.forEach(item => {
          acc.calories += item.calories;
          acc.protein += item.protein_g;
          acc.carbs += item.carbohydrates_total_g;
          acc.fat += item.fat_total_g;
        });
        return acc;
      },
      {calories: 0, protein: 0, carbs: 0, fat: 0},
    );
  };

  const getTotalCalories = (): number => {
    if (!dailyData) return 0;
    return dailyData.meals.reduce((total, meal) => {
      return (
        total + meal.items.reduce((sum, item) => sum + item.calories, 0)
      );
    }, 0);
  };

  const getDailyCalories = (data: DailyData): number => {
    return data.meals.reduce((total, meal) => {
      return total + meal.items.reduce((sum, item) => sum + item.calories, 0);
    }, 0);
  };

  const didMeetGoals = (data: DailyData, profile: UserProfile): boolean => {
    const calories = getDailyCalories(data);
    const withinCalories = calories <= profile.targetCalories;
    const waterOk = data.waterIntake >= profile.targetWater;
    const stepsOk = data.steps >= profile.targetSteps;
    return withinCalories && waterOk && stepsOk;
  };

  const loadCalendarForMonth = async (baseDate: Date) => {
    if (!profile) return;
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const lastDay = new Date(year, month + 1, 0);

    const label = baseDate.toLocaleString(undefined, {
      month: 'long',
      year: 'numeric',
    });
    setCalendarMonthLabel(label);

    const days: {date: string; day: number; metGoals: boolean}[] = [];
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const daily = await storageService.getDailyData(dateStr);
      const metGoals = didMeetGoals(daily, profile);
      days.push({date: dateStr, day, metGoals});
    }
    setCalendarDays(days);
  };

  const getTotalCaloriesBurned = (): number => {
    if (!dailyData) return 0;
    const activityCalories = dailyData.activities.reduce(
      (total, activity) => total + activity.caloriesBurned,
      0,
    );
    // Estimate calories from steps (rough average: ~0.04 kcal per step).
    const stepCalories = Math.round(dailyData.steps * 0.04);
    return activityCalories + stepCalories;
  };

  const handleAddActivity = async () => {
    if (newActivity.name && newActivity.duration && newActivity.caloriesBurned) {
      await storageService.addActivity({
        name: newActivity.name,
        duration: parseInt(newActivity.duration),
        caloriesBurned: parseInt(newActivity.caloriesBurned),
      });
      setNewActivity({name: '', duration: '', caloriesBurned: ''});
      setShowActivityModal(false);
      loadData();
    }
  };

  const handleAddWater = async () => {
    if (waterAmount) {
      await storageService.updateWaterIntake(parseInt(waterAmount));
      setShowWaterModal(false);
      loadData();
    }
  };

  const handleUpdateNotes = async () => {
    await storageService.updateNotes(notes);
  };

  const ensureActivityRecognitionPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    const permission = PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION;
    if (!permission) return true;
    const alreadyGranted =
      (await PermissionsAndroid.check(permission)) === true;
    if (alreadyGranted) return true;
    const result = await PermissionsAndroid.request(permission, {
      title: 'Activity recognition permission',
      message:
        'Allow access to activity recognition so the app can track your steps.',
      buttonPositive: 'Allow',
      buttonNegative: 'Cancel',
    });
    return result === PermissionsAndroid.RESULTS.GRANTED;
  };

  useEffect(() => {
    let subscription: any;
    const start = async () => {
      const granted = await ensureActivityRecognitionPermission();
      if (!granted) return;

      setUpdateIntervalForType(SensorTypes.accelerometer, 200);

      subscription = accelerometer
        .pipe(
          map(({x, y, z, timestamp}) => ({
            magnitude: Math.sqrt(x * x + y * y + z * z),
            timestamp: timestamp ?? Date.now(),
          })),
        )
        .subscribe(({magnitude, timestamp}: any) => {
          const delta = Math.abs(magnitude - 1); // remove gravity
          const now = timestamp as number;
          const minStepInterval = 350;
          const stepThreshold = 1.0;

          if (
            delta > stepThreshold &&
            now - lastStepTimeRef.current > minStepInterval
          ) {
            lastStepTimeRef.current = now;
            stepsRef.current += 1;
            setSteps(stepsRef.current);
          }
        });
    };

    start();
    return () => {
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    const now = Date.now();
    if (now - lastPersistRef.current > 5000) {
      storageService.updateSteps(steps);
      lastPersistRef.current = now;
    }
  }, [steps]);

  const breakfast = getMealNutrition('breakfast');
  const lunch = getMealNutrition('lunch');
  const dinner = getMealNutrition('dinner');
  const calendarFirstDay = calendarDays.length
    ? new Date(`${calendarDays[0].date}T00:00:00`).getDay()
    : 0;
  const calendarCells: Array<
    {date: string; day: number; metGoals: boolean} | null
  > = [...Array(calendarFirstDay).fill(null), ...calendarDays];

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.background}]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.primary}]}> 
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Your Nutrition Journey</Text>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={async () => {
              await loadCalendarForMonth(new Date());
              setShowCalendarModal(true);
            }}>
            <Text style={styles.calendarButtonText}>🗓️</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.streakContainer}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>{streak} Day Streak</Text>
        </View>
      </View>

      {/* Calories Summary */}
      <View style={[styles.card, {backgroundColor: colors.card}]}> 
        <Text style={[styles.cardTitle, {color: colors.text}]}>Today's Calories</Text>
        <View style={styles.caloriesContainer}>
          <Text style={[styles.caloriesNumber, {color: colors.text}]}>
            {getTotalCalories().toFixed(0)}
          </Text>
          <Text style={[styles.caloriesLabel, {color: colors.mutedText}]}>consumed</Text>
        </View>
        <Text style={[styles.caloriesBurned, {color: colors.mutedText}]}> 
          🔥 {getTotalCaloriesBurned()} calories burned
        </Text>
      </View>

      {/* Meals */}
      <View style={[styles.card, {backgroundColor: colors.card}]}> 
        <Text style={[styles.cardTitle, {color: colors.text}]}>Meals</Text>

        <View style={styles.mealItem}>
          <View style={styles.mealHeader}>
            <View style={styles.mealTitleRow}>
              <Text style={styles.mealEmoji}>🌅</Text>
              <Text style={[styles.mealName, {color: colors.text}]}>Breakfast</Text>
            </View>
            <TouchableOpacity
              style={styles.mealAddButton}
              onPress={() => navigation.navigate('Scanner', {preselectedMeal: 'breakfast'})}>
              <Text style={styles.mealAddButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={[styles.nutritionText, {color: colors.mutedText}]}> 
              {breakfast.calories.toFixed(0)} cal
            </Text>
            <Text style={[styles.nutritionText, {color: colors.mutedText}]}> 
              P: {breakfast.protein.toFixed(0)}g
            </Text>
            <Text style={[styles.nutritionText, {color: colors.mutedText}]}> 
              C: {breakfast.carbs.toFixed(0)}g
            </Text>
            <Text style={[styles.nutritionText, {color: colors.mutedText}]}> 
              F: {breakfast.fat.toFixed(0)}g
            </Text>
          </View>
        </View>

        <View style={styles.mealItem}>
          <View style={styles.mealHeader}>
            <View style={styles.mealTitleRow}>
              <Text style={styles.mealEmoji}>☀️</Text>
              <Text style={[styles.mealName, {color: colors.text}]}>Lunch</Text>
            </View>
            <TouchableOpacity
              style={styles.mealAddButton}
              onPress={() => navigation.navigate('Scanner', {preselectedMeal: 'lunch'})}>
              <Text style={styles.mealAddButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={[styles.nutritionText, {color: colors.mutedText}]}> 
              {lunch.calories.toFixed(0)} cal
            </Text>
            <Text style={[styles.nutritionText, {color: colors.mutedText}]}>P: {lunch.protein.toFixed(0)}g</Text>
            <Text style={[styles.nutritionText, {color: colors.mutedText}]}>C: {lunch.carbs.toFixed(0)}g</Text>
            <Text style={[styles.nutritionText, {color: colors.mutedText}]}>F: {lunch.fat.toFixed(0)}g</Text>
          </View>
        </View>

        <View style={styles.mealItem}>
          <View style={styles.mealHeader}>
            <View style={styles.mealTitleRow}>
              <Text style={styles.mealEmoji}>🌙</Text>
              <Text style={[styles.mealName, {color: colors.text}]}>Dinner</Text>
            </View>
            <TouchableOpacity
              style={styles.mealAddButton}
              onPress={() => navigation.navigate('Scanner', {preselectedMeal: 'dinner'})}>
              <Text style={styles.mealAddButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={[styles.nutritionText, {color: colors.mutedText}]}> 
              {dinner.calories.toFixed(0)} cal
            </Text>
            <Text style={[styles.nutritionText, {color: colors.mutedText}]}> 
              P: {dinner.protein.toFixed(0)}g
            </Text>
            <Text style={[styles.nutritionText, {color: colors.mutedText}]}> 
              C: {dinner.carbs.toFixed(0)}g
            </Text>
            <Text style={[styles.nutritionText, {color: colors.mutedText}]}>F: {dinner.fat.toFixed(0)}g</Text>
          </View>
        </View>
      </View>

      {/* Activities */}
      <View style={[styles.card, {backgroundColor: colors.card}]}> 
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, {color: colors.text}]}>Activities</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowActivityModal(true)}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityItem}>
          <Text style={styles.activityEmoji}>👟</Text>
          <View style={styles.activityContent}>
            <Text style={[styles.activityName, {color: colors.text}]}>Steps</Text>
            <Text style={[styles.stepsValue, {color: colors.mutedText}]}>
              {steps.toLocaleString()} / {targetSteps.toLocaleString()} steps
            </Text>
            <View style={[styles.stepsProgress, {backgroundColor: colors.border}]}> 
              <View
                style={[
                  styles.stepsProgressBar,
                  {
                    width: `${Math.min((steps / targetSteps) * 100, 100)}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {dailyData?.activities.map(activity => (
          <View key={activity.id} style={styles.activityItem}>
            <Text style={styles.activityEmoji}>💪</Text>
            <View style={styles.activityContent}>
              <Text style={[styles.activityName, {color: colors.text}]}>{activity.name}</Text>
              <Text style={[styles.activityDetails, {color: colors.mutedText}]}>
                {activity.duration} min • {activity.caloriesBurned} cal
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Water Tracker */}
      <View style={[styles.card, {backgroundColor: colors.card}]}> 
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, {color: colors.text}]}>Water Intake</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowWaterModal(true)}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.waterContainer}>
          <Text style={styles.waterEmoji}>💧</Text>
          <Text style={[styles.waterAmount, {color: colors.info}]}> 
            {dailyData?.waterIntake || 0} ml
          </Text>
        </View>
        <View style={[styles.waterProgress, {backgroundColor: colors.border}]}> 
          <View
            style={[
              styles.waterProgressBar,
              {
                width: `${Math.min(
                  ((dailyData?.waterIntake || 0) / 2000) * 100,
                  100,
                )}%`,
                backgroundColor: colors.info,
              },
            ]}
          />
        </View>
        <Text style={[styles.waterGoal, {color: colors.mutedText}]}>Goal: 2000 ml</Text>
      </View>

      {/* Notes */}
      <View style={[styles.card, {backgroundColor: colors.card}]}> 
        <Text style={[styles.cardTitle, {color: colors.text}]}>Notes</Text>
        <TextInput
          style={[styles.notesInput, {color: colors.text, borderColor: colors.border, backgroundColor: colors.surface}]}
          value={notes}
          onChangeText={setNotes}
          onBlur={handleUpdateNotes}
          placeholder="How are you feeling today?"
          placeholderTextColor={colors.mutedText}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Activity Modal */}
      <Modal
        visible={showActivityModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowActivityModal(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, {backgroundColor: colors.card}]}> 
            <Text style={[styles.modalTitle, {color: colors.text}]}>Add Activity</Text>
            <TextInput
              style={[styles.input, {color: colors.text, borderColor: colors.border, backgroundColor: colors.surface}]}
              placeholder="Activity name (e.g., Running)"
              placeholderTextColor={colors.mutedText}
              value={newActivity.name}
              onChangeText={text =>
                setNewActivity({...newActivity, name: text})
              }
            />
            <TextInput
              style={[styles.input, {color: colors.text, borderColor: colors.border, backgroundColor: colors.surface}]}
              placeholder="Duration (minutes)"
              placeholderTextColor={colors.mutedText}
              value={newActivity.duration}
              onChangeText={text =>
                setNewActivity({...newActivity, duration: text})
              }
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, {color: colors.text, borderColor: colors.border, backgroundColor: colors.surface}]}
              placeholder="Calories burned"
              placeholderTextColor={colors.mutedText}
              value={newActivity.caloriesBurned}
              onChangeText={text =>
                setNewActivity({...newActivity, caloriesBurned: text})
              }
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowActivityModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddActivity}>
                <Text style={styles.saveButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Water Modal */}
      <Modal
        visible={showWaterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowWaterModal(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, {backgroundColor: colors.card}]}> 
            <Text style={[styles.modalTitle, {color: colors.text}]}>Add Water</Text>
            <View style={styles.waterOptions}>
              {[250, 500, 750, 1000].map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={styles.waterOption}
                  onPress={() => setWaterAmount(amount.toString())}>
                  <Text style={[styles.waterOptionText, {color: colors.text}]}>{amount} ml</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Custom amount (ml)"
              value={waterAmount}
              onChangeText={setWaterAmount}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowWaterModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddWater}>
                <Text style={styles.saveButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Goals Calendar Modal */}
      <Modal
        visible={showCalendarModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowCalendarModal(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.calendarModalContent, {backgroundColor: colors.card}]}> 
            <View style={styles.calendarHeader}>
              <Text style={[styles.calendarTitle, {color: colors.text}]}> 
                {calendarMonthLabel}
              </Text>
              <TouchableOpacity
                style={styles.calendarCloseButton}
                onPress={() => setShowCalendarModal(false)}>
                <Text style={[styles.calendarCloseText, {color: colors.text}]}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.calendarWeekRow}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text
                  key={day}
                  style={[styles.calendarWeekText, {color: colors.mutedText}]}> 
                  {day}
                </Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarCells.map((item, index) =>
                item ? (
                  <View
                    key={item.date}
                    style={[
                      styles.calendarDay,
                      item.metGoals
                        ? styles.calendarDaySuccess
                        : styles.calendarDayFail,
                    ]}>
                    <Text style={styles.calendarDayNumber}>{item.day}</Text>
                    <Text style={styles.calendarDayStatus}>
                      {item.metGoals ? '✓' : '✕'}
                    </Text>
                  </View>
                ) : (
                  <View key={`empty-${index}`} style={styles.calendarDayEmpty} />
                ),
              )}
            </View>
            <View style={styles.calendarLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.calendarDaySuccess]} />
                <Text style={[styles.legendText, {color: colors.text}]}> 
                  Goal met
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.calendarDayFail]} />
                <Text style={[styles.legendText, {color: colors.text}]}> 
                  Goal missed
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  calendarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarButtonText: {
    fontSize: 18,
    color: 'white',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  streakEmoji: {
    fontSize: 20,
    marginRight: 5,
  },
  streakText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  caloriesContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  caloriesNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  caloriesLabel: {
    fontSize: 16,
    color: '#666',
  },
  caloriesBurned: {
    textAlign: 'center',
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 10,
  },
  mealItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealAddButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  mealEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 34,
  },
  nutritionText: {
    fontSize: 12,
    color: '#666',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  activityDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  stepsValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  stepsProgress: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  stepsProgressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  waterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  waterEmoji: {
    fontSize: 30,
    marginRight: 10,
  },
  waterAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  waterProgress: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  waterProgressBar: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  waterGoal: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '85%',
  },
  calendarModalContent: {
    borderRadius: 20,
    padding: 20,
    width: '90%',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  calendarCloseButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarWeekText: {
    width: '14.2%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.2%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayEmpty: {
    width: '14.2%',
    aspectRatio: 1,
    marginBottom: 8,
  },
  calendarDaySuccess: {
    backgroundColor: '#4CAF50',
  },
  calendarDayFail: {
    backgroundColor: '#FF6B6B',
  },
  calendarDayNumber: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarDayStatus: {
    color: 'white',
    fontSize: 12,
    marginTop: 2,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: '600',
  },
  saveButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: '600',
  },
  waterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  waterOption: {
    width: '48%',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  waterOptionText: {
    textAlign: 'center',
    color: '#2196F3',
    fontWeight: '600',
  },
});

export default HomeScreen;
