import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen';
import RecipesScreen from './screens/RecipesScreen';
import ProfileScreen from './screens/ProfileScreen';
import FoodScannerScreen from './screens/FoodScannerScreen';

const Tab = createBottomTabNavigator();

const Navigation = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#4CAF50',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#E0E0E0',
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
            tabBarIcon: ({color}) => <TabIcon emoji="🏠" color={color} />,
          }}
        />
        <Tab.Screen
          name="Scanner"
          component={FoodScannerScreen}
          options={{
            tabBarIcon: ({color}) => <TabIcon emoji="📸" color={color} />,
          }}
        />
        <Tab.Screen
          name="Recipes"
          component={RecipesScreen}
          options={{
            tabBarIcon: ({color}) => <TabIcon emoji="🍳" color={color} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({color}) => <TabIcon emoji="👤" color={color} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const TabIcon = ({emoji, color}: {emoji: string; color: string}) => {
  const {Text} = require('react-native');
  return <Text style={{fontSize: 24, opacity: color === '#4CAF50' ? 1 : 0.5}}>{emoji}</Text>;
};

export default Navigation;
