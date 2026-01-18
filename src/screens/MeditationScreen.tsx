import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Geolocation from 'react-native-geolocation-service';
import {storageService, MeditationLog, UserProfile} from '../services/storageService';
import {useFocusEffect} from '@react-navigation/native';
import {useTheme} from '../theme/ThemeContext';

const DURATION_OPTIONS = [5, 10, 15, 20, 30];

const MeditationScreen = () => {
  const {colors} = useTheme();
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [remainingSec, setRemainingSec] = useState(durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<MeditationLog[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadLogs();
    loadProfile();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadLogs();
      loadProfile();
    }, []),
  );

  useEffect(() => {
    if (!isRunning) {
      setRemainingSec(durationMinutes * 60);
    }
  }, [durationMinutes]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setRemainingSec(prev => {
        if (prev <= 1) {
          stopTimer(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const loadLogs = async () => {
    const saved = await storageService.getMeditationLogs();
    setLogs(saved.slice(0, 5));
  };

  const loadProfile = async () => {
    const userProfile = await storageService.getUserProfile();
    setProfile(userProfile);
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const permission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
      const alreadyGranted =
        (await PermissionsAndroid.check(permission)) === true;
      if (alreadyGranted) return true;
      const result = await PermissionsAndroid.request(permission, {
        title: 'Location permission',
        message: 'Allow location access to tag meditation sessions by city.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      });
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }

    return true;
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'NutritionApp/1.0',
        },
      });
      const data = await response.json();
      const address = data.address || {};
      return {
        city:
          address.city ||
          address.town ||
          address.village ||
          address.suburb ||
          address.hamlet,
        region: address.state || address.region,
        country: address.country,
      };
    } catch (error) {
      return undefined;
    }
  };

  const getLocationLabel = async () => {
    const granted = await requestLocationPermission();
    if (!granted) return undefined;

    return new Promise<MeditationLog['location'] | undefined>(resolve => {
      Geolocation.getCurrentPosition(
        async position => {
          const location = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude,
          );
          resolve(location);
        },
        () => resolve(undefined),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000,
        },
      );
    });
  };

  const saveLog = async () => {
    const location = await getLocationLabel();
    await storageService.addMeditationLog({
      durationSec: durationMinutes * 60,
      timestamp: Date.now(),
      location,
    });
    await loadLogs();
  };

  const startTimer = () => {
    if (isRunning) return;
    setIsRunning(true);
  };

  const stopTimer = async (completed: boolean) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    if (completed) {
      await saveLog();
      Alert.alert('Session complete', 'Great job! Your meditation was logged.');
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setRemainingSec(durationMinutes * 60);
  };

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(remainingSec / 60);
    const seconds = remainingSec % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }, [remainingSec]);

  const animationSource = profile?.gender === 'female'
    ? require('../../assets/animations/meditation_female.json')
    : require('../../assets/animations/meditation_male.json');

  return (
    <ScrollView style={[styles.container, {backgroundColor: colors.background}]} contentContainerStyle={styles.content}>
      <View style={[styles.header, {backgroundColor: colors.primary}]}> 
        <Text style={styles.headerTitle}>Meditation</Text>
        <Text style={styles.headerSubtitle}>
          Breathe, focus, and track your mindfulness.
        </Text>
      </View>

      <View style={[styles.timerCard, {backgroundColor: colors.card}]}> 
        <View style={styles.animationContainer}>
          <LottieView
            source={animationSource}
            autoPlay
            loop
            style={styles.animation}
          />
        </View>
        <Text style={[styles.timerText, {color: colors.text}]}>{formattedTime}</Text>
        <Text style={[styles.timerLabel, {color: colors.mutedText}]}>minutes remaining</Text>

        <View style={styles.timerControls}>
          {isRunning ? (
            <TouchableOpacity
              style={[styles.controlButton, styles.pauseButton]}
              onPress={() => stopTimer(false)}>
              <Text style={styles.controlButtonText}>Pause</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.controlButton, styles.startButton]}
              onPress={startTimer}>
              <Text style={styles.controlButtonText}>Start</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.controlButton, styles.resetButton]}
            onPress={resetTimer}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.durationCard, {backgroundColor: colors.card}]}> 
        <Text style={[styles.sectionTitle, {color: colors.text}]}>Choose duration</Text>
        <View style={styles.durationOptions}>
          {DURATION_OPTIONS.map(option => (
            <TouchableOpacity
              key={option}
              style={[
                styles.durationChip,
                {backgroundColor: colors.surface},
                durationMinutes === option && [styles.durationChipActive, {backgroundColor: colors.primary}],
              ]}
              onPress={() => setDurationMinutes(option)}>
              <Text
                style={[
                  styles.durationChipText,
                  {color: colors.text},
                  durationMinutes === option && styles.durationChipTextActive,
                ]}>
                {option} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.logsCard, {backgroundColor: colors.card}]}> 
        <Text style={[styles.sectionTitle, {color: colors.text}]}>Last 5 sessions</Text>
        {logs.length === 0 ? (
          <Text style={[styles.emptyText, {color: colors.mutedText}]}>No meditation sessions yet.</Text>
        ) : (
          logs.slice(0, 5).map(log => {
            const date = new Date(log.timestamp);
            const locationLabel = [
              log.location?.city,
              log.location?.region,
              log.location?.country,
            ]
              .filter(Boolean)
              .join(', ');
            return (
              <View key={log.id} style={styles.logItem}>
                <View>
                  <Text style={[styles.logTitle, {color: colors.text}]}>
                    {Math.round(log.durationSec / 60)} min session
                  </Text>
                  <Text style={[styles.logDate, {color: colors.mutedText}]}>
                    {date.toLocaleDateString()} • {date.toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={[styles.logLocation, {color: colors.primary}]}> 
                  {locationLabel || 'Location unavailable'}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 24,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  timerCard: {
    margin: 16,
    marginTop: -10,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  animationContainer: {
    width: 160,
    height: 160,
    marginBottom: 10,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  timerText: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#333',
  },
  timerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  timerControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  pauseButton: {
    backgroundColor: '#FFB300',
  },
  resetButton: {
    backgroundColor: '#F5F5F5',
  },
  controlButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  resetButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  durationCard: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  durationChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  durationChipActive: {
    backgroundColor: '#4CAF50',
  },
  durationChipText: {
    color: '#333',
    fontWeight: '600',
  },
  durationChipTextActive: {
    color: 'white',
  },
  logsCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyText: {
    color: '#666',
    fontSize: 13,
  },
  logItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  logDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  logLocation: {
    marginTop: 6,
    fontSize: 12,
    color: '#4CAF50',
  },
});

export default MeditationScreen;
