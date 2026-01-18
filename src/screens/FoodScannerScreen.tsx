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
  Image,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Vibration,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {InferenceSession, Tensor} from 'onnxruntime-react-native';
import RNFS from 'react-native-fs';
import {FOODS, FoodItem} from '../../assets/foods';
import {
  storageService,
  NutritionItem,
  FoodHistory,
} from '../services/storageService';
import {getTopKPredictions, Prediction} from '../../assets/imageNetClasses';
import {preprocessImageForResNet} from '../utils/imagePreprocessing';

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

const FoodScannerScreen = ({route}: any) => {
  const preselectedMeal = route?.params?.preselectedMeal as 'breakfast' | 'lunch' | 'dinner' | undefined;
  const [selectedFood, setSelectedFood] = useState<NutritionItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<FoodHistory[]>([]);
  const [showMealTypeModal, setShowMealTypeModal] = useState(false);
  const [pendingFood, setPendingFood] = useState<NutritionItem | null>(null);
  const [session, setSession] = useState<InferenceSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedImage, setDetectedImage] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    loadHistory();
    loadModel();
  }, []);

  const ensureAndroidCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    const permission = PermissionsAndroid.PERMISSIONS.CAMERA;
    const alreadyGranted =
      (await PermissionsAndroid.check(permission)) === true;
    if (alreadyGranted) return true;

    const result = await PermissionsAndroid.request(permission, {
      title: 'Camera permission',
      message: 'Allow access to the camera to scan food images with AI.',
      buttonPositive: 'Allow',
      buttonNegative: 'Cancel',
    });

    return result === PermissionsAndroid.RESULTS.GRANTED;
  };

  const ensureAndroidPhotoPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    // Android 13+ uses READ_MEDIA_IMAGES; older versions use READ_EXTERNAL_STORAGE.
    const permission =
      (PermissionsAndroid.PERMISSIONS as any).READ_MEDIA_IMAGES ??
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

    const alreadyGranted =
      (await PermissionsAndroid.check(permission)) === true;
    if (alreadyGranted) return true;

    const result = await PermissionsAndroid.request(permission, {
      title: 'Photo permission',
      message: 'Allow access to photos so you can pick an image to scan.',
      buttonPositive: 'Allow',
      buttonNegative: 'Cancel',
    });

    return result === PermissionsAndroid.RESULTS.GRANTED;
  };

  const loadModel = async () => {
    try {
      // Construct the correct path for Android and iOS
      let modelPath: string;
      if (Platform.OS === 'android') {
        // For Android, copy the model to a readable location first
        modelPath = `${RNFS.DocumentDirectoryPath}/resnet50-v1-12-int8.onnx`;
        const bundlePath = 'models/resnet50-v1-12-int8.onnx';
        
        // Check if model already exists in documents
        const exists = await RNFS.exists(modelPath);
        if (!exists) {
          // Copy from assets to documents directory
          await RNFS.copyFileAssets(bundlePath, modelPath);
          console.log('Model copied to:', modelPath);
        }
      } else {
        // For iOS
        modelPath = `${RNFS.MainBundlePath}/assets/models/resnet50-v1-12-int8.onnx`;
      }
      
      const modelSession = await InferenceSession.create(modelPath);
      setSession(modelSession);
      console.log('ResNet model loaded successfully from:', modelPath);

      // Helpful diagnostics: input/output names and metadata.
      // (These properties exist on onnxruntime-web; on RN they may vary, so keep it defensive.)
      const sessionAny = modelSession as any;
      const inputNames: string[] =
        sessionAny.inputNames ?? Object.keys(sessionAny.inputMetadata ?? {});
      const outputNames: string[] =
        sessionAny.outputNames ?? Object.keys(sessionAny.outputMetadata ?? {});
      if (inputNames.length > 0) {
        console.log('Model inputNames:', inputNames);
      }
      if (outputNames.length > 0) {
        console.log('Model outputNames:', outputNames);
      }
    } catch (error) {
      console.error('Error loading model:', error);
      Alert.alert('Model Error', 'Failed to load AI model. AI scanning may not work properly.');
    }
  };

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
    // Haptic feedback: safe no-op on devices without vibrator; emulator may ignore it.
    try {
      Vibration.vibrate(35);
    } catch {
      // Ignore vibration errors to avoid any UX disruption.
    }
    setPendingFood(item);
    
    // If a meal was preselected from HomeScreen, auto-add to that meal
    if (preselectedMeal) {
      confirmAddMeal(preselectedMeal);
    } else {
      setShowMealTypeModal(true);
    }
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

  const handleCameraCapture = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await ensureAndroidCameraPermission();
        if (!granted) {
          Alert.alert('Permission required', 'Camera permission was denied.');
          return;
        }
      }

      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        if (result.errorCode === 'camera_unavailable') {
          Alert.alert(
            'Camera unavailable',
            'This emulator/device has no camera available. Use the Gallery button to pick an image instead.',
          );
          return;
        }
        if (result.errorCode === 'permission') {
          Alert.alert(
            'Permission required',
            'Camera permission is required to take a photo.',
          );
          return;
        }
        Alert.alert(
          'Camera Error',
          result.errorMessage || 'Failed to capture image',
        );
        return;
      }

      if (result.assets && result.assets[0]?.uri) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handleGalleryPick = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await ensureAndroidPhotoPermission();
        if (!granted) {
          Alert.alert('Permission required', 'Photo permission was denied.');
          return;
        }
      }

      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Gallery Error', result.errorMessage || 'Failed to pick image');
        return;
      }

      if (result.assets && result.assets[0]?.uri) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const processImage = async (imageUri: string) => {
    if (!session) {
      Alert.alert('Error', 'AI model not loaded. Please restart the app.');
      return;
    }

    setIsProcessing(true);
    setDetectedImage(imageUri);
    setPredictions([]);

    try {
      // Preprocess image
      const imageTensor = await preprocessImageForResNet(imageUri);
      
      // Create ONNX tensor
      const tensor = new Tensor('float32', imageTensor.data, imageTensor.dims);
      
      // Run inference
      const sessionAny = session as any;
      const inputName: string =
        sessionAny.inputNames?.[0] ??
        Object.keys(sessionAny.inputMetadata ?? {})[0] ??
        'data';
      const feeds: Record<string, Tensor> = {[inputName]: tensor};
      const results = await session.run(feeds as any);
      
      // Get output tensor
      const outputName: string =
        sessionAny.outputNames?.[0] ?? Object.keys(results)[0];
      const outputTensor = (results as any)[outputName];
      if (!outputTensor || !outputTensor.data) {
        throw new Error('Model returned no output data');
      }

      // Output might be Float32Array (fp32) or a typed array (quantized models).
      // For ranking, treating values as numbers is sufficient.
      const logits = Array.from(outputTensor.data as any, (v: any) => Number(v));
      
      // Apply softmax to get probabilities
      const maxLogit = Math.max(...logits);
      const expScores = logits.map(x => Math.exp(x - maxLogit));
      const sumExp = expScores.reduce((a, b) => a + b, 0);
      const probabilities = expScores.map(x => x / sumExp);
      
      // Get top 3 predictions
      const topPredictions = getTopKPredictions(probabilities, 3);
      setPredictions(topPredictions);
      
      // Show results
      const resultsText = topPredictions
        .map((pred, idx) => `${idx + 1}. ${pred.name} (${pred.confidence.toFixed(1)}%)`)
        .join('\n');
      
      Alert.alert(
        '🤖 AI Detection Results',
        `Top 3 predictions:\n\n${resultsText}\n\nNote: This model is trained on ImageNet and may not accurately identify all food items.`,
        [
          {text: 'OK'},
          {
            text: 'Search for First Result',
            onPress: () => {
              if (topPredictions[0]) {
                setSearchQuery(topPredictions[0].name);
                handleSearchByQuery(topPredictions[0].name);
              }
            },
          },
        ],
      );
    } catch (error) {
      console.error('Image processing error:', error);
      Alert.alert('Processing Error', 'Failed to process image with AI model');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearchByQuery = (query: string) => {
    const searchTerm = query.toLowerCase();
    const found = FOODS.find(
      food =>
        food.name.toLowerCase().includes(searchTerm) ||
        food.query.toLowerCase().includes(searchTerm),
    );

    if (found) {
      const nutritionItem = convertToNutritionItem(found);
      setSelectedFood(nutritionItem);
      storageService.addFoodHistory([nutritionItem]);
      loadHistory();
    } else {
      Alert.alert(
        'No Match',
        `Could not find "${query}" in our food database. Try searching manually.`,
      );
    }
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
        <View style={styles.scanButtonsContainer}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleCameraCapture}
            disabled={isProcessing || !session}>
            <Text style={styles.scanButtonText}>📸 Scan with AI</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={handleGalleryPick}
            disabled={isProcessing || !session}>
            <Text style={styles.scanButtonText}>🖼️ Gallery</Text>
          </TouchableOpacity>
        </View>
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color="white" />
            <Text style={styles.processingText}>Processing image...</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* AI Detection Results */}
        {detectedImage && predictions.length > 0 && (
          <View style={styles.aiResultsContainer}>
            <Text style={styles.sectionTitle}>AI Detection Results</Text>
            <Image source={{uri: detectedImage}} style={styles.detectedImage} />
            <View style={styles.predictionsContainer}>
              {predictions.map((pred, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.predictionCard}
                  onPress={() => {
                    setSearchQuery(pred.name);
                    handleSearchByQuery(pred.name);
                  }}>
                  <View style={styles.predictionRank}>
                    <Text style={styles.predictionRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.predictionInfo}>
                    <Text style={styles.predictionName}>{pred.name}</Text>
                    <Text style={styles.predictionConfidence}>
                      {pred.confidence.toFixed(1)}% confidence
                    </Text>
                  </View>
                  <Text style={styles.predictionArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

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
  scanButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  scanButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginRight: 5,
  },
  galleryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginLeft: 5,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    padding: 10,
  },
  processingText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  aiResultsContainer: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
    resizeMode: 'cover',
  },
  predictionsContainer: {
    marginTop: 10,
  },
  predictionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  predictionRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  predictionRankText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  predictionInfo: {
    flex: 1,
  },
  predictionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  predictionConfidence: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  predictionArrow: {
    fontSize: 20,
    color: '#FF6B6B',
    fontWeight: 'bold',
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
