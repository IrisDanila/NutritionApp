import React from 'react';
import {View, Pressable} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '../theme/ThemeContext';
import {TabParamList} from './types';
import DashboardScreen from '../screens/DashboardScreen';
import DiaryScreen from '../screens/DiaryScreen';
import FoodRecognitionScreen from '../screens/FoodRecognitionScreen';
import CoachScreen from '../screens/CoachScreen';
import MoreScreen from '../screens/MoreScreen';

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<keyof TabParamList, string> = {
  Home: 'home-variant',
  Diary: 'notebook',
  Scan: 'camera-iris',
  Coach: 'robot-happy',
  More: 'dots-grid',
};

/** Raised center button for the Scan tab. */
const ScanButton: React.FC<{onPress?: () => void}> = ({onPress}) => {
  const {theme} = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{top: -18, justifyContent: 'center', alignItems: 'center'}}>
      <LinearGradient
        colors={theme.gradientPrimary}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: theme.primary,
          shadowOpacity: 0.4,
          shadowRadius: 10,
          shadowOffset: {width: 0, height: 4},
          elevation: 6,
          borderWidth: 4,
          borderColor: theme.bg,
        }}>
        <MaterialCommunityIcons name="camera-iris" size={28} color={theme.textOnPrimary} />
      </LinearGradient>
    </Pressable>
  );
};

export const TabNavigator: React.FC = () => {
  const {theme} = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textFaint,
        tabBarStyle: {
          backgroundColor: theme.bgElevated,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {fontSize: 11, fontWeight: '600'},
        tabBarIcon: ({color, focused}) => (
          <MaterialCommunityIcons
            name={ICONS[route.name]}
            size={focused ? 26 : 24}
            color={color}
          />
        ),
      })}>
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Diary" component={DiaryScreen} />
      <Tab.Screen
        name="Scan"
        component={FoodRecognitionScreen}
        options={{
          tabBarLabel: '',
          tabBarButton: props => (
            <View style={{flex: 1, alignItems: 'center'}}>
              <ScanButton onPress={props.onPress} />
            </View>
          ),
        }}
      />
      <Tab.Screen name="Coach" component={CoachScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
