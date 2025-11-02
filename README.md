# Nutrition App - React NativeThis is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).



A comprehensive nutrition tracking mobile application built with React Native (without Expo) featuring meal tracking, recipe discovery, activity logging, and AI-powered food recognition.# Getting Started



## Features> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.



### 🏠 Home Screen## Step 1: Start Metro

- **Day Streak Tracker**: Keeps track of consecutive days of app usage

- **Meal Tracking**: Log breakfast, lunch, and dinner with detailed nutrition values (calories, protein, carbs, fat)First, you will need to run **Metro**, the JavaScript build tool for React Native.

- **Activity Widget**: Track daily steps and add custom activities with duration and calories burned

- **Water Tracker**: Monitor daily water intake with visual progress barTo start the Metro dev server, run the following command from the root of your React Native project:

- **Notes**: Add daily notes about your health and wellness

```sh

### 📸 Food Scanner Screen# Using npm

- **AI Food Recognition**: Mock AI scanner to identify foods (ready for ML integration)npm start

- **Nutrition API Integration**: Get detailed nutrition information using CalorieNinjas API

- **Popular Foods**: Quick access to common foods# OR using Yarn

- **Scan History**: Keep track of previously scanned foodsyarn start

- **"I will eat this" Feature**: Add scanned foods directly to your daily meal log```



### 🍳 Recipes Screen## Step 2: Build and run your app

- **Recipe Search**: Search meals by name using TheMealDB API

- **Categories**: Browse recipes by categoryWith Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

- **Detailed Instructions**: View ingredients, cooking instructions, and nutrition info

- **Video Tutorials**: Links to cooking videos (when available)### Android



### 👤 Profile Screen```sh

- **Personal Information**: Name, age, weight, height# Using npm

- **BMI Calculator**: Automatic BMI calculation with categorynpm run android

- **Goals Setting**: Set weight goals (lose/maintain/gain) and daily targets

- **Weekly Progress**: View stats for the past 7 days# OR using Yarn

- **Editable Profile**: Update your information anytimeyarn android

```

## Tech Stack

### iOS

- **React Native CLI** (without Expo)

- **React Navigation** - Bottom tabs navigationFor iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

- **AsyncStorage** - Local data persistence

- **Axios** - API requestsThe first time you create a new project, run the Ruby bundler to install CocoaPods itself:

- **TypeScript** - Type safety

```sh

## APIs Usedbundle install

```

1. **TheMealDB API** - Recipe database

   - Free test API key: `1`Then, and every time you update your native dependencies, run:

   - Documentation: https://www.themealdb.com/api.php

```sh

2. **CalorieNinjas API** - Nutrition informationbundle exec pod install

   - Get your API key at: https://calorieninjas.com/api```

   - Update the key in `src/services/nutritionService.ts`

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

## Setup Instructions

```sh

### Prerequisites# Using npm

- Node.js (v18 or later)npm run ios

- npm or yarn

- Android Studio (for Android development)# OR using Yarn

- Xcode (for iOS development - macOS only)yarn ios

- JDK 17 or later```



### InstallationIf everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.



1. **Navigate to the project directory:**This is one way to run your app — you can also build it directly from Android Studio or Xcode.

   ```bash

   cd d:\projects\nutrition-app\NutritionApp## Step 3: Modify your app

   ```

Now that you have successfully run the app, let's make changes!

2. **Install dependencies:**

   ```bashOpen `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

   npm install

   ```When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:



3. **Configure API Keys:**- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).

   - **iOS**: Press <kbd>R</kbd> in iOS Simulator.

   Open `src/services/nutritionService.ts` and add your CalorieNinjas API key:

   ```typescript## Congratulations! :tada:

   const API_KEY = 'YOUR_API_KEY_HERE';

   ```You've successfully run and modified your React Native App. :partying_face:



4. **Android Setup:**### Now what?

   

   For react-native-vector-icons, you may need to link fonts. The app should work out of the box, but if you have issues with icons, add to `android/app/build.gradle`:- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).

   ```gradle- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

   apply from: file("../../node_modules/react-native-vector-icons/fonts.gradle")

   ```# Troubleshooting



5. **iOS Setup (macOS only):**If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

   ```bash

   cd ios# Learn More

   pod install

   cd ..To learn more about React Native, take a look at the following resources:

   ```

- [React Native Website](https://reactnative.dev) - learn more about React Native.

### Running the App- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.

- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.

**Start Metro Bundler:**- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.

```bash- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

npm start
```

**Android:**
```bash
npm run android
```

**iOS (macOS only):**
```bash
npm run ios
```

## Project Structure

```
NutritionApp/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx          # Main dashboard
│   │   ├── FoodScannerScreen.tsx   # AI food scanner
│   │   ├── RecipesScreen.tsx       # Recipe browser
│   │   └── ProfileScreen.tsx       # User profile
│   ├── services/
│   │   ├── storageService.ts       # AsyncStorage wrapper
│   │   ├── mealDBService.ts        # TheMealDB API
│   │   └── nutritionService.ts     # CalorieNinjas API
│   └── Navigation.tsx              # Navigation setup
├── App.tsx                         # App entry point
└── package.json
```

## Key Features Implementation

### Data Persistence
All data is stored locally using AsyncStorage:
- Daily meals and nutrition
- Activity logs
- Water intake
- User profile
- Food scan history
- Streak data

### Home Screen Integration
When you tap "I will eat this!" in the Food Scanner:
1. Select meal type (breakfast/lunch/dinner/snack)
2. Food is added to daily log
3. Home screen stats automatically update
4. Calories, protein, carbs, and fat are calculated

### Nutrition Tracking
Each meal displays:
- Total calories
- Protein (g)
- Carbohydrates (g)
- Fat (g)
- Fiber (g)
- Sugar (g)

## Future Enhancements

- **Real AI Integration**: Replace mock AI with actual ML model for food recognition
- **Camera Integration**: Use device camera for food photos
- **Charts & Graphs**: Visual progress tracking
- **Barcode Scanner**: Scan product barcodes for nutrition info
- **Meal Planning**: Plan meals for the week
- **Social Features**: Share progress with friends
- **Offline Mode**: Full offline functionality
- **Export Data**: Export nutrition data to CSV/PDF

## Development Notes

- The app uses mock AI food recognition. To implement real AI:
  1. Integrate TensorFlow Lite or ML Kit
  2. Train or use a pre-trained food recognition model
  3. Replace the `mockAIScan` function in FoodScannerScreen

- CalorieNinjas API has a free tier with limitations. For production, consider:
  - Getting a paid API key
  - Implementing caching
  - Using alternative nutrition APIs

## Troubleshooting

**Metro bundler cache issues:**
```bash
npm start -- --reset-cache
```

**Android build issues:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**iOS build issues:**
```bash
cd ios
pod install
cd ..
npm run ios
```

---

Built with ❤️ using React Native
