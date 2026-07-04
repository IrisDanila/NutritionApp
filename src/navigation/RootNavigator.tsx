import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './types';
import {useAppStore} from '../store/useAppStore';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import FoodSearchScreen from '../screens/FoodSearchScreen';
import FoodDetailScreen from '../screens/FoodDetailScreen';
import WaterScreen from '../screens/WaterScreen';
import MeditationScreen from '../screens/MeditationScreen';
import HistoryScreen from '../screens/HistoryScreen';
import WeightScreen from '../screens/WeightScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import RecipesScreen from '../screens/RecipesScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import GoalCalendarScreen from '../screens/GoalCalendarScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const onboarded = useAppStore(s => s.onboarded);

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {!onboarded ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="FoodSearch"
            component={FoodSearchScreen}
            options={{presentation: 'modal'}}
          />
          <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
          <Stack.Screen name="Water" component={WaterScreen} />
          <Stack.Screen name="Meditation" component={MeditationScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Weight" component={WeightScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Achievements" component={AchievementsScreen} />
          <Stack.Screen name="Challenges" component={ChallengesScreen} />
          <Stack.Screen name="Recipes" component={RecipesScreen} />
          <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
          <Stack.Screen name="GoalCalendar" component={GoalCalendarScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
