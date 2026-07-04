import React, {useMemo, useState} from 'react';
import {View, Pressable} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import IconButton from '../components/IconButton';
import FoodRow from '../components/FoodRow';
import {MacroRow} from '../components/MacroBar';
import {useTheme} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import {RootStackParamList} from '../navigation/types';
import {MealType} from '../store/types';
import {useAppStore} from '../store/useAppStore';
import {useDayEntries, useTargets} from '../hooks/useNutrition';
import {sumEntries} from '../services/nutrition';
import {addDays, prettyDate, todayKey} from '../utils/date';
import {round} from '../utils/math';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MEAL_ORDER: {key: MealType; label: string; icon: string}[] = [
  {key: 'breakfast', label: 'Breakfast', icon: 'weather-sunset-up'},
  {key: 'lunch', label: 'Lunch', icon: 'white-balance-sunny'},
  {key: 'dinner', label: 'Dinner', icon: 'weather-night'},
  {key: 'snack', label: 'Snacks', icon: 'food-apple'},
];

export const DiaryScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const [day, setDay] = useState(todayKey());
  const entries = useDayEntries(day);
  const targets = useTargets();
  const removeFood = useAppStore(s => s.removeFood);

  const totals = useMemo(() => sumEntries(entries), [entries]);
  const byMeal = useMemo(() => {
    const map: Record<MealType, typeof entries> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    entries.forEach(e => map[e.meal].push(e));
    return map;
  }, [entries]);

  const calTarget = targets?.calories ?? 2000;
  const pct = Math.min(1, totals.calories / calTarget);

  return (
    <Screen scroll>
      {/* Date switcher */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.lg,
        }}>
        <IconButton name="chevron-left" tinted onPress={() => setDay(addDays(day, -1))} />
        <Pressable onPress={() => setDay(todayKey())}>
          <Txt variant="h2" center>
            {prettyDate(day)}
          </Txt>
        </Pressable>
        <IconButton
          name="chevron-right"
          tinted
          onPress={() => setDay(addDays(day, 1))}
        />
      </View>

      {/* Summary */}
      <Card>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <View>
            <Txt variant="display">{round(totals.calories)}</Txt>
            <Txt tone="muted">of {calTarget} kcal</Txt>
          </View>
          <View style={{alignItems: 'flex-end'}}>
            <Txt variant="h2" tone="primary">
              {Math.max(0, calTarget - round(totals.calories))}
            </Txt>
            <Txt variant="caption" tone="muted">
              remaining
            </Txt>
          </View>
        </View>
        <View
          style={{
            height: 10,
            borderRadius: radius.pill,
            backgroundColor: theme.bgSunken,
            marginVertical: spacing.lg,
            overflow: 'hidden',
          }}>
          <View
            style={{
              width: `${pct * 100}%`,
              height: '100%',
              backgroundColor: pct >= 1 ? theme.warning : theme.primary,
            }}
          />
        </View>
        {targets ? (
          <MacroRow
            carbs={{value: totals.carbs, target: targets.carbs}}
            protein={{value: totals.protein, target: targets.protein}}
            fat={{value: totals.fat, target: targets.fat}}
          />
        ) : null}
      </Card>

      {/* Meals */}
      {MEAL_ORDER.map(meal => {
        const items = byMeal[meal.key];
        const mealKcal = items.reduce((a, e) => a + e.calories, 0);
        return (
          <View key={meal.key} style={{marginTop: spacing.xl}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: spacing.sm,
              }}>
              <Icon name={meal.icon} size={20} color={theme.primary} />
              <Txt variant="h3" style={{marginLeft: spacing.sm, flex: 1}}>
                {meal.label}
              </Txt>
              <Txt tone="muted">{round(mealKcal)} kcal</Txt>
            </View>
            <Card padded={false} style={{paddingHorizontal: spacing.lg}}>
              {items.length === 0 ? (
                <Txt tone="faint" style={{paddingVertical: spacing.md}}>
                  Nothing here yet.
                </Txt>
              ) : (
                items.map((e, i) => (
                  <View
                    key={e.id}
                    style={
                      i < items.length - 1
                        ? {borderBottomWidth: 1, borderBottomColor: theme.border}
                        : undefined
                    }>
                    <FoodRow entry={e} onDelete={() => removeFood(e.id, day)} />
                  </View>
                ))
              )}
              <Pressable
                onPress={() => navigation.navigate('FoodSearch', {meal: meal.key})}
                style={({pressed}) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: spacing.md,
                  borderTopWidth: items.length ? 1 : 0,
                  borderTopColor: theme.border,
                  opacity: pressed ? 0.6 : 1,
                })}>
                <Icon name="plus" size={18} color={theme.primary} />
                <Txt tone="primary" variant="label" style={{marginLeft: 6}}>
                  Add food
                </Txt>
              </Pressable>
            </Card>
          </View>
        );
      })}
    </Screen>
  );
};

export default DiaryScreen;
