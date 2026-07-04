import {FoodItem} from '../services/usda';
import {MealType} from '../store/types';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  FoodSearch: {meal?: MealType} | undefined;
  FoodDetail: {
    item: FoodItem;
    meal?: MealType;
    fromScan?: boolean;
    confidence?: number;
    presetGrams?: number;
  };
  Water: undefined;
  Meditation: undefined;
  History: undefined;
  Weight: undefined;
  Settings: undefined;
  Achievements: undefined;
  Challenges: undefined;
  Recipes: undefined;
  RecipeDetail: {id: string; name?: string};
  GoalCalendar: undefined;
};

export type TabParamList = {
  Home: undefined;
  Diary: undefined;
  Scan: undefined;
  Coach: undefined;
  More: undefined;
};
