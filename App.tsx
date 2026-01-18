/**
 * Nutrition App
 * React Native nutrition tracking application
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {
  StatusBar,
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Navigation from './src/Navigation';
import {ThemeProvider, useTheme} from './src/theme/ThemeContext';
import {storageService, UserProfile} from './src/services/storageService';

const AppContent = () => {
  const {isDark, colors} = useTheme();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingProfile, setOnboardingProfile] = useState({
    name: '',
    age: '25',
    weight: '70',
    height: '170',
    goal: 'maintain' as UserProfile['goal'],
    gender: 'male' as UserProfile['gender'],
    targetCalories: '2000',
    targetWater: '2000',
    targetSteps: '10000',
  });

  useEffect(() => {
    const init = async () => {
      const completed = await storageService.getOnboardingComplete();
      const profile = await storageService.getUserProfile();
      setOnboardingProfile({
        name: profile.name,
        age: String(profile.age),
        weight: String(profile.weight),
        height: String(profile.height),
        goal: profile.goal,
        gender: profile.gender,
        targetCalories: String(profile.targetCalories),
        targetWater: String(profile.targetWater),
        targetSteps: String(profile.targetSteps),
      });
      setShowOnboarding(!completed);
    };

    init();
  }, []);

  const handleCompleteOnboarding = async () => {
    const age = parseInt(onboardingProfile.age, 10) || 25;
    const weight = parseFloat(onboardingProfile.weight) || 70;
    const height = parseInt(onboardingProfile.height, 10) || 170;
    const targetCalories = parseInt(onboardingProfile.targetCalories, 10) || 2000;
    const targetWater = parseInt(onboardingProfile.targetWater, 10) || 2000;
    const targetSteps = parseInt(onboardingProfile.targetSteps, 10) || 10000;

    const profile: UserProfile = {
      name: onboardingProfile.name.trim() || 'User',
      age,
      weight,
      height,
      goal: onboardingProfile.goal,
      gender: onboardingProfile.gender,
      targetCalories,
      targetWater,
      targetSteps,
    };

    await storageService.saveUserProfile(profile);
    await storageService.setOnboardingComplete();
    setShowOnboarding(false);
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Navigation />
      <Modal visible={showOnboarding} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, {backgroundColor: colors.card}]}> 
            <Text style={[styles.modalTitle, {color: colors.text}]}> 
              Welcome! Let’s set your goals
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, {color: colors.text}]}>Name</Text>
              <TextInput
                style={[styles.input, {color: colors.text, borderColor: colors.border, backgroundColor: colors.surface}]}
                value={onboardingProfile.name}
                onChangeText={text =>
                  setOnboardingProfile(prev => ({...prev, name: text}))
                }
                placeholder="Your name"
                placeholderTextColor={colors.mutedText}
              />

              <Text style={[styles.label, {color: colors.text}]}>Age</Text>
              <TextInput
                style={[styles.input, {color: colors.text, borderColor: colors.border, backgroundColor: colors.surface}]}
                value={onboardingProfile.age}
                onChangeText={text =>
                  setOnboardingProfile(prev => ({...prev, age: text}))
                }
                keyboardType="numeric"
              />

              <Text style={[styles.label, {color: colors.text}]}>Weight (kg)</Text>
              <TextInput
                style={[styles.input, {color: colors.text, borderColor: colors.border, backgroundColor: colors.surface}]}
                value={onboardingProfile.weight}
                onChangeText={text =>
                  setOnboardingProfile(prev => ({...prev, weight: text}))
                }
                keyboardType="numeric"
              />

              <Text style={[styles.label, {color: colors.text}]}>Height (cm)</Text>
              <TextInput
                style={[styles.input, {color: colors.text, borderColor: colors.border, backgroundColor: colors.surface}]}
                value={onboardingProfile.height}
                onChangeText={text =>
                  setOnboardingProfile(prev => ({...prev, height: text}))
                }
                keyboardType="numeric"
              />

              <Text style={[styles.label, {color: colors.text}]}>Gender</Text>
              <View style={styles.optionRow}>
                {(['male', 'female'] as const).map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionChip,
                      {backgroundColor: colors.surface, borderColor: colors.border},
                      onboardingProfile.gender === option && [styles.optionChipActive, {backgroundColor: colors.primary}],
                    ]}
                    onPress={() =>
                      setOnboardingProfile(prev => ({...prev, gender: option}))
                    }>
                    <Text
                      style={[
                        styles.optionChipText,
                        {color: colors.text},
                        onboardingProfile.gender === option && styles.optionChipTextActive,
                      ]}>
                      {option === 'male' ? 'Male' : 'Female'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, {color: colors.text}]}>Goal</Text>
              <View style={styles.optionRow}>
                {(['lose', 'maintain', 'gain'] as const).map(option => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionChip,
                      {backgroundColor: colors.surface, borderColor: colors.border},
                      onboardingProfile.goal === option && [styles.optionChipActive, {backgroundColor: colors.primary}],
                    ]}
                    onPress={() =>
                      setOnboardingProfile(prev => ({...prev, goal: option}))
                    }>
                    <Text
                      style={[
                        styles.optionChipText,
                        {color: colors.text},
                        onboardingProfile.goal === option && styles.optionChipTextActive,
                      ]}>
                      {option === 'lose'
                        ? 'Lose'
                        : option === 'maintain'
                          ? 'Maintain'
                          : 'Gain'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, {color: colors.text}]}>Target calories (daily)</Text>
              <TextInput
                style={[styles.input, {color: colors.text, borderColor: colors.border, backgroundColor: colors.surface}]}
                value={onboardingProfile.targetCalories}
                onChangeText={text =>
                  setOnboardingProfile(prev => ({...prev, targetCalories: text}))
                }
                keyboardType="numeric"
              />

              <Text style={[styles.label, {color: colors.text}]}>Target water (ml)</Text>
              <TextInput
                style={[styles.input, {color: colors.text, borderColor: colors.border, backgroundColor: colors.surface}]}
                value={onboardingProfile.targetWater}
                onChangeText={text =>
                  setOnboardingProfile(prev => ({...prev, targetWater: text}))
                }
                keyboardType="numeric"
              />

              <Text style={[styles.label, {color: colors.text}]}>Target steps (daily)</Text>
              <TextInput
                style={[styles.input, {color: colors.text, borderColor: colors.border, backgroundColor: colors.surface}]}
                value={onboardingProfile.targetSteps}
                onChangeText={text =>
                  setOnboardingProfile(prev => ({...prev, targetSteps: text}))
                }
                keyboardType="numeric"
              />
            </ScrollView>
            <TouchableOpacity
              style={[styles.primaryButton, {backgroundColor: colors.primary}]}
              onPress={handleCompleteOnboarding}>
              <Text style={styles.primaryButtonText}>Save & Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  optionChipActive: {},
  optionChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  optionChipTextActive: {
    color: 'white',
  },
  primaryButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '700',
  },
});

