import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {mealDBService, Meal, MealCategory} from '../services/mealDBService';
import {useTheme} from '../theme/ThemeContext';

const RecipesScreen = () => {
  const {colors} = useTheme();
  const [categories, setCategories] = useState<MealCategory[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'categories'>('categories');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const data = await mealDBService.getMealCategories();
    setCategories(data);
    setLoading(false);
  };

  const searchMeals = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    const results = await mealDBService.searchMealByName(searchQuery);
    setMeals(results);
    setLoading(false);
  };

  const loadMealsByCategory = async (category: string) => {
    setLoading(true);
    const results = await mealDBService.filterByCategory(category);
    setMeals(results);
    setActiveTab('search');
    setLoading(false);
  };

  const loadMealDetails = async (mealId: string) => {
    setLoading(true);
    const meal = await mealDBService.getMealById(mealId);
    setSelectedMeal(meal);
    setLoading(false);
  };

  const getIngredients = (meal: Meal) => {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        ingredients.push({ingredient, measure});
      }
    }
    return ingredients;
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}> 
      {/* Search Bar */}
      <View style={[styles.searchContainer, {backgroundColor: colors.card}]}> 
        <TextInput
          style={[styles.searchInput, {color: colors.text}]}
          placeholder="Search recipes..."
          placeholderTextColor={colors.mutedText}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchMeals}
        />
        <TouchableOpacity style={[styles.searchButton, {backgroundColor: colors.primary}]} onPress={searchMeals}>
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'categories' && [styles.activeTab, {backgroundColor: colors.primary}]]}
          onPress={() => setActiveTab('categories')}>
          <Text
            style={[
              styles.tabText,
              {color: colors.mutedText},
              activeTab === 'categories' && styles.activeTabText,
            ]}>
            Categories
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'search' && [styles.activeTab, {backgroundColor: colors.primary}]]}
          onPress={() => setActiveTab('search')}>
          <Text
            style={[
              styles.tabText,
              {color: colors.mutedText},
              activeTab === 'search' && styles.activeTabText,
            ]}>
            Results
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {activeTab === 'categories' ? (
            <View style={styles.categoriesGrid}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.idCategory}
                  style={[styles.categoryCard, {backgroundColor: colors.card}]}
                  onPress={() => loadMealsByCategory(category.strCategory)}>
                  <Image
                    source={{uri: category.strCategoryThumb}}
                    style={styles.categoryImage}
                  />
                  <Text style={[styles.categoryName, {color: colors.text}]}>
                    {category.strCategory}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.mealsGrid}>
              {meals.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, {color: colors.mutedText}]}>
                    Search for your favorite recipes!
                  </Text>
                </View>
              ) : (
                meals.map(meal => (
                  <TouchableOpacity
                    key={meal.idMeal}
                    style={[styles.mealCard, {backgroundColor: colors.card}]}
                    onPress={() => loadMealDetails(meal.idMeal)}>
                    <Image
                      source={{uri: meal.strMealThumb}}
                      style={styles.mealImage}
                    />
                    <View style={styles.mealInfo}>
                      <Text style={[styles.mealName, {color: colors.text}]} numberOfLines={2}>
                        {meal.strMeal}
                      </Text>
                      {meal.strCategory && (
                        <Text style={[styles.mealCategory, {color: colors.mutedText}]}>
                          {meal.strCategory}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Meal Details Modal */}
      <Modal
        visible={selectedMeal !== null}
        animationType="slide"
        onRequestClose={() => setSelectedMeal(null)}>
        <View style={[styles.modalContainer, {backgroundColor: colors.background}]}> 
          {selectedMeal && (
            <ScrollView>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedMeal(null)}>
                  <Text style={[styles.closeButtonText, {color: colors.text}]}>✕</Text>
                </TouchableOpacity>
              </View>
              <Image
                source={{uri: selectedMeal.strMealThumb}}
                style={styles.modalImage}
              />
              <View style={[styles.modalContent, {backgroundColor: colors.card}]}> 
                <Text style={[styles.modalTitle, {color: colors.text}]}>{selectedMeal.strMeal}</Text>
                <View style={styles.modalTags}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      {selectedMeal.strCategory}
                    </Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{selectedMeal.strArea}</Text>
                  </View>
                </View>

                <Text style={styles.sectionTitle}>Ingredients</Text>
                <View style={styles.ingredientsList}>
                  {getIngredients(selectedMeal).map((item, index) => (
                    <View key={index} style={styles.ingredientItem}>
                      <Text style={styles.ingredientBullet}>•</Text>
                      <Text style={styles.ingredientText}>
                        {item.measure} {item.ingredient}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.sectionTitle}>Instructions</Text>
                <Text style={styles.instructions}>
                  {selectedMeal.strInstructions}
                </Text>

                {selectedMeal.strYoutube && (
                  <TouchableOpacity style={styles.youtubeButton}>
                    <Text style={styles.youtubeButtonText}>
                      📺 Watch Video
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
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
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  categoryCard: {
    width: '47%',
    margin: '1.5%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  mealsGrid: {
    padding: 10,
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  mealImage: {
    width: '100%',
    height: 200,
  },
  mealInfo: {
    padding: 15,
  },
  mealName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  mealCategory: {
    fontSize: 14,
    color: '#4CAF50',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    position: 'absolute',
    top: 40,
    right: 15,
    zIndex: 1,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 24,
  },
  modalImage: {
    width: '100%',
    height: 300,
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  modalTags: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  tagText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  ingredientsList: {
    marginBottom: 10,
  },
  ingredientItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ingredientBullet: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 10,
    fontWeight: 'bold',
  },
  ingredientText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  instructions: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 20,
  },
  youtubeButton: {
    backgroundColor: '#FF0000',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  youtubeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RecipesScreen;
