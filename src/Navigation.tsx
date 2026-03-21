import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen';
import RecipesScreen from './screens/RecipesScreen';
import ProfileScreen from './screens/ProfileScreen';
import FoodScannerScreen from './screens/FoodScannerScreen';
import MeditationScreen from './screens/MeditationScreen';
import GamificationScreen from './screens/GamificationScreen';
import AICoachScreen from './screens/AICoachScreen';
import {useTheme} from './theme/ThemeContext';

const Tab = createBottomTabNavigator();

const Navigation = () => {
  const {colors} = useTheme();
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedText,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({focused}) => (
              <TabIcon emoji="🏠" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Scanner"
          component={FoodScannerScreen}
          options={{
            tabBarIcon: ({focused}) => (
              <TabIcon emoji="📸" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Recipes"
          component={RecipesScreen}
          options={{
            tabBarIcon: ({focused}) => (
              <TabIcon emoji="🍳" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Meditate"
          component={MeditationScreen}
          options={{
            tabBarIcon: ({focused}) => (
              <TabIcon emoji="🧘" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Progress"
          component={GamificationScreen}
          options={{
            tabBarIcon: ({focused}) => (
              <TabIcon emoji="🏆" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Coach"
          component={AICoachScreen}
          options={{
            tabBarIcon: ({focused}) => (
              <TabIcon emoji="🧠" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({focused}) => (
              <TabIcon emoji="👤" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const TabIcon = ({emoji, focused}: {emoji: string; focused: boolean}) => {
  const {Text} = require('react-native');
  return <Text style={{fontSize: 24, opacity: focused ? 1 : 0.5}}>{emoji}</Text>;
};

export default Navigation;
