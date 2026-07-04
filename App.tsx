import React, {useEffect} from 'react';
import {View, ActivityIndicator} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  Theme as NavTheme,
} from '@react-navigation/native';
import {ThemeProvider, useTheme} from './src/theme/ThemeContext';
import {useAppStore} from './src/store/useAppStore';
import RootNavigator from './src/navigation/RootNavigator';
import {syncReminders} from './src/services/notifications';

const Inner: React.FC = () => {
  const {theme, isDark} = useTheme();
  const hydrated = useAppStore(s => s.hydrated);

  // Re-schedule reminder alarms once the persisted settings are loaded.
  useEffect(() => {
    if (hydrated) syncReminders(useAppStore.getState().settings);
  }, [hydrated]);

  const navTheme: NavTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: theme.bg,
      card: theme.bgElevated,
      text: theme.text,
      border: theme.border,
      primary: theme.primary,
      notification: theme.accent,
    },
  };

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Inner />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
