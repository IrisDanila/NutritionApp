import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import {FOODS, FoodItem} from '../../assets/foods';
import {
  storageService,
  NutritionItem,
  FoodHistory,
} from '../services/storageService';

interface PopularFood {
  name: string;
  emoji: string;
  query: string;
}

const POPULAR_FOODS: PopularFood[] = [
  {name: 'Apple', emoji: '🍎', query: '1 medium apple'},
  {name: 'Banana', emoji: '🍌', query: '1 medium banana'},
  {name: 'Chicken Breast (cooked)', emoji: '🍗', query: '100g cooked'},
  {name: 'White Rice (cooked)', emoji: '🍚', query: '1 cup cooked'},
  {name: 'Broccoli', emoji: '🥦', query: '1 cup chopped'},
  {name: 'Salmon (cooked)', emoji: '🐟', query: '100g cooked'},
  {name: 'Eggs (large)', emoji: '🥚', query: '2 large eggs'},
  {name: 'Avocado', emoji: '🥑', query: '1 medium avocado'},
  {name: 'Oatmeal (rolled oats, cooked)', emoji: '🥣', query: '1 cup cooked'},
  {name: 'Greek Yogurt (plain, nonfat)', emoji: '🥛', query: '1 cup'},
  {name: 'Almonds', emoji: '🌰', query: '1 oz'},
  {name: 'Sweet Potato', emoji: '🍠', query: '1 medium'},
];

const FoodScannerScreen = () => {
  const [selectedFood, setSelectedFood] = useState<NutritionItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<FoodHistory[]>([]);
  const [showMealTypeModal, setShowMealTypeModal] = useState(false);
  const [pendingFood, setPendingFood] = useState<NutritionItem | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const foodHistory = await storageService.getFoodHistory();
    setHistory(foodHistory);
  };

  // Convert FoodItem from assets to NutritionItem format
  const convertToNutritionItem = (food: FoodItem): NutritionItem => {
    return {
      name: food.name,
      calories: food.nutrients.calories,
      serving_size_g: 100, // Default serving size
      fat_total_g: food.nutrients.fat_g,
      protein_g: food.nutrients.protein_g,
      carbohydrates_total_g: food.nutrients.carbs_g,
      fiber_g: food.nutrients.fiber_g,
      sugar_g: food.nutrients.sugar_g,
    };
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    // Search in local dataset
    const query = searchQuery.toLowerCase();
    const found = FOODS.find(
      food =>
        food.name.toLowerCase().includes(query) ||
        food.query.toLowerCase().includes(query),
    );

    if (found) {
      const nutritionItem = convertToNutritionItem(found);
      setSelectedFood(nutritionItem);
      storageService.addFoodHistory([nutritionItem]);
      loadHistory();
    } else {
      Alert.alert(
        'No Results',
        `Could not find "${searchQuery}" in the database. Try searching for: ${FOODS.slice(
          0,
          5,
        )
          .map(f => f.name)
          .join(', ')}, etc.`,
      );
    }
  };

  const handlePopularFoodClick = (food: PopularFood) => {
    // Find in local dataset
    const found = FOODS.find(f => f.name === food.name);
    if (found) {
      const nutritionItem = convertToNutritionItem(found);
      setSelectedFood(nutritionItem);
      storageService.addFoodHistory([nutritionItem]);
      loadHistory();
    }
  };

  const handleHistoryClick = (item: FoodHistory) => {
    if (item.items.length > 0) {
      setSelectedFood(item.items[0]);
    }
  };

  const handleIWillEatThis = (item: NutritionItem) => {
    setPendingFood(item);
    setShowMealTypeModal(true);
  };

  const confirmAddMeal = async (
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  ) => {
    if (pendingFood) {
      await storageService.addMeal(mealType, [pendingFood]);
      setShowMealTypeModal(false);
      setPendingFood(null);
      Alert.alert(
        'Success!',
        'Food added to your daily log. Check the Home screen for updated stats!',
      );
    }
  };

  const mockAIScan = () => {
    // MOCK AI IMPLEMENTATION
    // This simulates an AI model recognizing food from a photo
    // In a real implementation, you would:
    // 1. Open the camera with react-native-camera or expo-camera
    // 2. Take a photo
    // 3. Send the image to a ML model (TensorFlow Lite, ML Kit, or cloud API)
    // 4. Get the detected food name back
    // 5. Use the detected food name to query the local database

    // Pick a random food from our dataset
    const randomFood = FOODS[Math.floor(Math.random() * FOODS.length)];

    Alert.alert(
      '📸 AI Food Recognition (Mock)',
      `AI detected: ${randomFood.name}\n${randomFood.query}\n\nNote: This is a mock AI response. In production, this would use a real ML model to analyze your photo.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'View Nutrition Info',
          onPress: () => {
            const nutritionItem = convertToNutritionItem(randomFood);
            setSelectedFood(nutritionItem);
            storageService.addFoodHistory([nutritionItem]);
            loadHistory();
          },
        },
      ],
    );
  };

  const renderNutritionDetails = (item: NutritionItem) => {
    const nutrition = {
      calories: item.calories,
      protein: item.protein_g,
      carbs: item.carbohydrates_total_g,
      fat: item.fat_total_g,
      fiber: item.fiber_g,
      sugar: item.sugar_g,
    };

    return (
      <View style={styles.nutritionDetails}>
        <View style={styles.nutritionHeader}>
          <Text style={styles.nutritionTitle}>{item.name}</Text>
          <TouchableOpacity
            style={styles.eatButton}
            onPress={() => handleIWillEatThis(item)}>
            <Text style={styles.eatButtonText}>I will eat this! 🍽️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calorieCard}>
          <Text style={styles.calorieValue}>
            {nutrition.calories.toFixed(0)}
          </Text>
          <Text style={styles.calorieLabel}>Calories</Text>
        </View>

        <View style={styles.macroContainer}>
          <View style={styles.macroCard}>
            <Text style={styles.macroValue}>
              {nutrition.protein.toFixed(1)}g
            </Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroCard}>
            <Text style={styles.macroValue}>
              {nutrition.carbs.toFixed(1)}g
            </Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroCard}>
            <Text style={styles.macroValue}>{nutrition.fat.toFixed(1)}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fiber</Text>
            <Text style={styles.detailValue}>
              {nutrition.fiber.toFixed(1)}g
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sugar</Text>
            <Text style={styles.detailValue}>
              {nutrition.sugar.toFixed(1)}g
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Serving Size</Text>
            <Text style={styles.detailValue}>{item.serving_size_g}g</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with AI Scan */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Food Scanner</Text>
        <TouchableOpacity style={styles.scanButton} onPress={mockAIScan}>
          <Text style={styles.scanButtonText}>📸 Scan with AI</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search food (e.g., chicken breast, apple...)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Popular Foods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Foods</Text>
          <View style={styles.popularGrid}>
            {POPULAR_FOODS.map((food, index) => (
              <TouchableOpacity
                key={index}
                style={styles.popularCard}
                onPress={() => handlePopularFoodClick(food)}>
                <Text style={styles.popularEmoji}>{food.emoji}</Text>
                <Text style={styles.popularName}>{food.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selected Food Nutrition */}
        {selectedFood && renderNutritionDetails(selectedFood)}

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Scans</Text>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>No scan history yet</Text>
          ) : (
            <FlatList
              data={history.slice(0, 5)}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.historyCard}
                  onPress={() => handleHistoryClick(item)}>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyName} numberOfLines={2}>
                      {item.items.map(i => i.name).join(', ')}
                    </Text>
                    <Text style={styles.historyCalories}>
                      {item.items
                        .reduce((sum, i) => sum + i.calories, 0)
                        .toFixed(0)}{' '}
                      cal
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(item.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id}
            />
          )}
        </View>
      </ScrollView>

      {/* Meal Type Selection Modal */}
      <Modal
        visible={showMealTypeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMealTypeModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Meal Type</Text>
            <Text style={styles.modalSubtitle}>
              When will you eat this food?
            </Text>

            <TouchableOpacity
              style={styles.mealTypeButton}
              onPress={() => confirmAddMeal('breakfast')}>
              <Text style={styles.mealTypeEmoji}>🌅</Text>
              <Text style={styles.mealTypeText}>Breakfast</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mealTypeButton}
              onPress={() => confirmAddMeal('lunch')}>
              <Text style={styles.mealTypeEmoji}>☀️</Text>
              <Text style={styles.mealTypeText}>Lunch</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mealTypeButton}
              onPress={() => confirmAddMeal('dinner')}>
              <Text style={styles.mealTypeEmoji}>🌙</Text>
              <Text style={styles.mealTypeText}>Dinner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mealTypeButton}
              onPress={() => confirmAddMeal('snack')}>
              <Text style={styles.mealTypeEmoji}>🍪</Text>
              <Text style={styles.mealTypeText}>Snack</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelModalButton}
              onPress={() => setShowMealTypeModal(false)}>
              <Text style={styles.cancelModalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#FF6B6B',
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  scanButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 10,
  },
  searchButton: {
    backgroundColor: '#FF6B6B',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  popularCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularEmoji: {
    fontSize: 30,
    marginBottom: 5,
  },
  popularName: {
    fontSize: 10,
    textAlign: 'center',
    color: '#333',
  },
  nutritionDetails: {
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
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  eatButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  eatButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  calorieCard: {
    backgroundColor: '#FFF3E0',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  calorieValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  calorieLabel: {
    fontSize: 14,
    color: '#666',
  },
  macroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  macroCard: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  detailsContainer: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  itemsList: {
    marginTop: 20,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  itemCard: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  itemCalories: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
  },
  itemServing: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  historyCard: {
    width: 150,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyContent: {
    flex: 1,
  },
  historyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  historyCalories: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 10,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    padding: 20,
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
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  mealTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  mealTypeEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  mealTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cancelModalButton: {
    backgroundColor: '#E0E0E0',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  cancelModalButtonText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: '600',
  },
});

export default FoodScannerScreen;
