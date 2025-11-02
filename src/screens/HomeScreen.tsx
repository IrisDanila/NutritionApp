import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {storageService, Activity, DailyData} from '../services/storageService';

interface NutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const HomeScreen = () => {
  const [streak, setStreak] = useState(0);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [newActivity, setNewActivity] = useState({
    name: '',
    duration: '',
    caloriesBurned: '',
  });
  const [waterAmount, setWaterAmount] = useState('250');
  const [steps, setSteps] = useState('0');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const data = await storageService.getDailyData(today);
    const currentStreak = await storageService.getStreak();
    setDailyData(data);
    setStreak(currentStreak);
    setSteps(data.steps.toString());
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

  const getTotalCaloriesBurned = (): number => {
    if (!dailyData) return 0;
    return dailyData.activities.reduce(
      (total, activity) => total + activity.caloriesBurned,
      0,
    );
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

  const handleUpdateSteps = async () => {
    if (steps) {
      await storageService.updateSteps(parseInt(steps));
      loadData();
    }
  };

  const handleUpdateNotes = async () => {
    await storageService.updateNotes(notes);
  };

  const breakfast = getMealNutrition('breakfast');
  const lunch = getMealNutrition('lunch');
  const dinner = getMealNutrition('dinner');

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Nutrition Journey</Text>
        <View style={styles.streakContainer}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>{streak} Day Streak</Text>
        </View>
      </View>

      {/* Calories Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's Calories</Text>
        <View style={styles.caloriesContainer}>
          <Text style={styles.caloriesNumber}>{getTotalCalories().toFixed(0)}</Text>
          <Text style={styles.caloriesLabel}>consumed</Text>
        </View>
        <Text style={styles.caloriesBurned}>
          🔥 {getTotalCaloriesBurned()} calories burned
        </Text>
      </View>

      {/* Meals */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meals</Text>

        <View style={styles.mealItem}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealEmoji}>🌅</Text>
            <Text style={styles.mealName}>Breakfast</Text>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionText}>
              {breakfast.calories.toFixed(0)} cal
            </Text>
            <Text style={styles.nutritionText}>
              P: {breakfast.protein.toFixed(0)}g
            </Text>
            <Text style={styles.nutritionText}>
              C: {breakfast.carbs.toFixed(0)}g
            </Text>
            <Text style={styles.nutritionText}>
              F: {breakfast.fat.toFixed(0)}g
            </Text>
          </View>
        </View>

        <View style={styles.mealItem}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealEmoji}>☀️</Text>
            <Text style={styles.mealName}>Lunch</Text>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionText}>
              {lunch.calories.toFixed(0)} cal
            </Text>
            <Text style={styles.nutritionText}>P: {lunch.protein.toFixed(0)}g</Text>
            <Text style={styles.nutritionText}>C: {lunch.carbs.toFixed(0)}g</Text>
            <Text style={styles.nutritionText}>F: {lunch.fat.toFixed(0)}g</Text>
          </View>
        </View>

        <View style={styles.mealItem}>
          <View style={styles.mealHeader}>
            <Text style={styles.mealEmoji}>🌙</Text>
            <Text style={styles.mealName}>Dinner</Text>
          </View>
          <View style={styles.nutritionRow}>
            <Text style={styles.nutritionText}>
              {dinner.calories.toFixed(0)} cal
            </Text>
            <Text style={styles.nutritionText}>
              P: {dinner.protein.toFixed(0)}g
            </Text>
            <Text style={styles.nutritionText}>
              C: {dinner.carbs.toFixed(0)}g
            </Text>
            <Text style={styles.nutritionText}>F: {dinner.fat.toFixed(0)}g</Text>
          </View>
        </View>
      </View>

      {/* Activities */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Activities</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowActivityModal(true)}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityItem}>
          <Text style={styles.activityEmoji}>👟</Text>
          <View style={styles.activityContent}>
            <Text style={styles.activityName}>Steps</Text>
            <TextInput
              style={styles.stepsInput}
              value={steps}
              onChangeText={setSteps}
              onBlur={handleUpdateSteps}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
        </View>

        {dailyData?.activities.map(activity => (
          <View key={activity.id} style={styles.activityItem}>
            <Text style={styles.activityEmoji}>💪</Text>
            <View style={styles.activityContent}>
              <Text style={styles.activityName}>{activity.name}</Text>
              <Text style={styles.activityDetails}>
                {activity.duration} min • {activity.caloriesBurned} cal
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Water Tracker */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Water Intake</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowWaterModal(true)}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.waterContainer}>
          <Text style={styles.waterEmoji}>💧</Text>
          <Text style={styles.waterAmount}>
            {dailyData?.waterIntake || 0} ml
          </Text>
        </View>
        <View style={styles.waterProgress}>
          <View
            style={[
              styles.waterProgressBar,
              {
                width: `${Math.min(
                  ((dailyData?.waterIntake || 0) / 2000) * 100,
                  100,
                )}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.waterGoal}>Goal: 2000 ml</Text>
      </View>

      {/* Notes */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notes</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          onBlur={handleUpdateNotes}
          placeholder="How are you feeling today?"
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Activity</Text>
            <TextInput
              style={styles.input}
              placeholder="Activity name (e.g., Running)"
              value={newActivity.name}
              onChangeText={text =>
                setNewActivity({...newActivity, name: text})
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Duration (minutes)"
              value={newActivity.duration}
              onChangeText={text =>
                setNewActivity({...newActivity, duration: text})
              }
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Calories burned"
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Water</Text>
            <View style={styles.waterOptions}>
              {[250, 500, 750, 1000].map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={styles.waterOption}
                  onPress={() => setWaterAmount(amount.toString())}>
                  <Text style={styles.waterOptionText}>{amount} ml</Text>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
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
    marginBottom: 8,
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
  stepsInput: {
    fontSize: 14,
    color: '#666',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 4,
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
