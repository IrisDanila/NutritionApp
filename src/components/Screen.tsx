import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
  StatusBar,
  RefreshControl,
} from 'react-native';
import {SafeAreaView, Edge} from 'react-native-safe-area-context';
import {useTheme} from '../theme/ThemeContext';
import {spacing} from '../theme/typography';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
}

/** Themed page wrapper that handles safe area, status bar and scrolling. */
export const Screen: React.FC<ScreenProps> = ({
  children,
  scroll = false,
  padded = true,
  edges = ['top'],
  contentStyle,
  refreshing,
  onRefresh,
}) => {
  const {theme, isDark} = useTheme();
  const pad = padded ? {padding: spacing.lg} : undefined;

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.flex, {backgroundColor: theme.bg}]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[pad, {paddingBottom: spacing.xxxl}, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            ) : undefined
          }>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, pad, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {flex: 1},
});

export default Screen;
