import React, {useEffect, useRef, useState} from 'react';
import {View, Animated, Easing, Pressable} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import IconButton from '../components/IconButton';
import Chip from '../components/Chip';
import Button from '../components/Button';
import {useTheme} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import {useAppStore} from '../store/useAppStore';
import {formatClock} from '../utils/date';

interface Phase {
  label: string;
  sec: number;
  scale: number; // target circle scale
}

interface Preset {
  key: string;
  name: string;
  subtitle: string;
  icon: string;
  phases: Phase[];
}

const PRESETS: Preset[] = [
  {
    key: 'box',
    name: 'Box Breathing',
    subtitle: 'Calm focus · 4-4-4-4',
    icon: 'square-outline',
    phases: [
      {label: 'Breathe in', sec: 4, scale: 1},
      {label: 'Hold', sec: 4, scale: 1},
      {label: 'Breathe out', sec: 4, scale: 0.55},
      {label: 'Hold', sec: 4, scale: 0.55},
    ],
  },
  {
    key: '478',
    name: '4-7-8 Relax',
    subtitle: 'Wind down for sleep',
    icon: 'weather-night',
    phases: [
      {label: 'Breathe in', sec: 4, scale: 1},
      {label: 'Hold', sec: 7, scale: 1},
      {label: 'Breathe out', sec: 8, scale: 0.5},
    ],
  },
  {
    key: 'calm',
    name: 'Calm',
    subtitle: 'Gentle 4-6 breathing',
    icon: 'spa',
    phases: [
      {label: 'Breathe in', sec: 4, scale: 1},
      {label: 'Breathe out', sec: 6, scale: 0.55},
    ],
  },
  {
    key: 'energize',
    name: 'Energize',
    subtitle: 'Quick morning reset',
    icon: 'white-balance-sunny',
    phases: [
      {label: 'Breathe in', sec: 2, scale: 1},
      {label: 'Breathe out', sec: 2, scale: 0.55},
    ],
  },
];

const DURATIONS = [1, 3, 5, 10]; // minutes

export const MeditationScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation();
  const addMeditation = useAppStore(s => s.addMeditation);
  const sessions = useAppStore(s => s.meditations);

  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  const [minutes, setMinutes] = useState(3);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(minutes * 60);
  const [phaseLabel, setPhaseLabel] = useState(preset.phases[0].label);

  const scale = useRef(new Animated.Value(0.55)).current;
  const cyclePos = useRef(0); // seconds into the current breathing cycle
  const phaseIdx = useRef(-1);

  const cycleLen = preset.phases.reduce((a, p) => a + p.sec, 0);

  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => {
      setRemaining(r => (r <= 1 ? 0 : r - 1));

      // Advance breathing cycle / animate on phase change.
      cyclePos.current = (cyclePos.current + 1) % cycleLen;
      let acc = 0;
      let idx = 0;
      for (let i = 0; i < preset.phases.length; i++) {
        if (cyclePos.current < acc + preset.phases[i].sec) {
          idx = i;
          break;
        }
        acc += preset.phases[i].sec;
      }
      if (idx !== phaseIdx.current) {
        phaseIdx.current = idx;
        const ph = preset.phases[idx];
        setPhaseLabel(ph.label);
        Animated.timing(scale, {
          toValue: ph.scale,
          duration: ph.sec * 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }).start();
      }
    }, 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, preset]);

  // Finish when the countdown hits zero — in an effect, so we never write to
  // the store from inside a state-updater (which warns about cross-component
  // updates during render).
  useEffect(() => {
    if (running && remaining === 0) finish(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, remaining]);

  const start = () => {
    setRemaining(minutes * 60);
    cyclePosReset();
    setRunning(true);
  };

  const cyclePosReset = () => {
    cyclePos.current = 0;
    phaseIdx.current = 0;
    setPhaseLabel(preset.phases[0].label);
    Animated.timing(scale, {
      toValue: preset.phases[0].scale,
      duration: preset.phases[0].sec * 1000,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const finish = (completed: boolean) => {
    setRunning(false);
    const elapsed = minutes * 60 - remaining;
    const dur = completed ? minutes * 60 : elapsed;
    if (dur >= 20) addMeditation(preset.name, dur);
    Animated.timing(scale, {
      toValue: 0.55,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const totalMins = Math.round(
    sessions.reduce((a, s) => a + s.durationSec, 0) / 60,
  );

  const animatedScale = scale.interpolate({
    inputRange: [0.5, 1],
    outputRange: [0.6, 1.15],
  });

  return (
    <Screen scroll={!running}>
      {!running ? (
        <>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg}}>
            <IconButton name="arrow-left" onPress={() => navigation.goBack()} />
            <Txt variant="h1" style={{marginLeft: spacing.sm}}>
              Meditation
            </Txt>
          </View>

          <Card
            flat
            style={{backgroundColor: theme.gradientCalm[0] + '22', borderColor: 'transparent'}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Icon name="meditation" size={28} color={theme.gradientCalm[0]} />
              <View style={{marginLeft: spacing.md}}>
                <Txt variant="h3">{sessions.length} sessions</Txt>
                <Txt tone="muted" variant="caption">
                  {totalMins} minutes of calm so far
                </Txt>
              </View>
            </View>
          </Card>

          <Txt variant="h3" style={{marginTop: spacing.xl, marginBottom: spacing.sm}}>
            Choose a technique
          </Txt>
          {PRESETS.map(p => (
            <Card
              key={p.key}
              onPress={() => setPreset(p)}
              style={{
                marginBottom: spacing.sm,
                borderColor: preset.key === p.key ? theme.primary : theme.border,
                borderWidth: preset.key === p.key ? 2 : 1,
              }}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radius.md,
                    backgroundColor: theme.primarySoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Icon name={p.icon} size={22} color={theme.primary} />
                </View>
                <View style={{flex: 1, marginLeft: spacing.md}}>
                  <Txt variant="h3">{p.name}</Txt>
                  <Txt variant="caption" tone="muted">
                    {p.subtitle}
                  </Txt>
                </View>
                {preset.key === p.key ? (
                  <Icon name="check-circle" size={22} color={theme.primary} />
                ) : null}
              </View>
            </Card>
          ))}

          <Txt variant="h3" style={{marginTop: spacing.lg, marginBottom: spacing.sm}}>
            Duration
          </Txt>
          <View style={{flexDirection: 'row', gap: spacing.sm}}>
            {DURATIONS.map(d => (
              <Chip
                key={d}
                label={`${d} min`}
                selected={minutes === d}
                onPress={() => setMinutes(d)}
              />
            ))}
          </View>

          <Button
            title="Begin session"
            icon="play"
            full
            onPress={start}
            style={{marginTop: spacing.xl}}
          />
        </>
      ) : (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Txt variant="h2" tone="muted">
            {preset.name}
          </Txt>
          <View
            style={{
              width: 280,
              height: 280,
              alignItems: 'center',
              justifyContent: 'center',
              marginVertical: spacing.xxl,
            }}>
            <Animated.View style={{transform: [{scale: animatedScale}]}}>
              <LinearGradient
                colors={theme.gradientCalm}
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 110,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Txt variant="h1" color="#fff">
                  {phaseLabel}
                </Txt>
              </LinearGradient>
            </Animated.View>
          </View>
          <Txt variant="displayLg">{formatClock(remaining)}</Txt>
          <Button
            title="End session"
            variant="secondary"
            icon="stop"
            onPress={() => finish(false)}
            style={{marginTop: spacing.xxl}}
          />
        </View>
      )}
    </Screen>
  );
};

export default MeditationScreen;
