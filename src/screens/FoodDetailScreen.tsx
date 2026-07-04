import React, {useMemo, useState} from 'react';
import {View, Pressable} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import Button from '../components/Button';
import Input from '../components/Input';
import Chip from '../components/Chip';
import ProgressRing from '../components/ProgressRing';
import {useTheme} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import {RootStackParamList} from '../navigation/types';
import {MealType} from '../store/types';
import {scaleMacros} from '../services/usda';
import {useAppStore} from '../store/useAppStore';
import {round} from '../utils/math';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'FoodDetail'>;

const MEALS: {value: MealType; label: string; icon: string}[] = [
  {value: 'breakfast', label: 'Breakfast', icon: 'weather-sunset-up'},
  {value: 'lunch', label: 'Lunch', icon: 'white-balance-sunny'},
  {value: 'dinner', label: 'Dinner', icon: 'weather-night'},
  {value: 'snack', label: 'Snack', icon: 'food-apple'},
];

const PORTION_CHIPS = [50, 100, 150, 200, 300];

export const FoodDetailScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const {item, fromScan, confidence, presetGrams} = route.params;
  const addFood = useAppStore(s => s.addFood);

  const isEditable = item.fdcId === -1; // manual / synthetic estimate
  const [meal, setMeal] = useState<MealType>(route.params.meal ?? 'snack');
  const [grams, setGrams] = useState(`${presetGrams ?? item.servingGrams ?? 100}`);

  // Editable per-100g values (used for manual / estimate items).
  const [per100, setPer100] = useState({
    calories: `${item.calories}`,
    protein: `${item.protein}`,
    carbs: `${item.carbs}`,
    fat: `${item.fat}`,
  });

  const base = useMemo(
    () =>
      isEditable
        ? {
            calories: num(per100.calories),
            protein: num(per100.protein),
            carbs: num(per100.carbs),
            fat: num(per100.fat),
          }
        : item,
    [isEditable, per100, item],
  );

  const g = num(grams) || 0;
  const scaled = scaleMacros(base, g);

  const save = () => {
    addFood({
      name: item.name,
      meal,
      amount: g,
      unit: 'g',
      calories: scaled.calories,
      carbs: scaled.carbs,
      protein: scaled.protein,
      fat: scaled.fat,
      source: fromScan ? 'ai-scan' : isEditable ? 'manual' : 'usda',
      fdcId: item.fdcId > 0 ? item.fdcId : undefined,
      confidence,
    });
    // Pop back to the app and land on the Diary tab.
    (navigation as any).navigate('Main', {screen: 'Diary'});
  };

  return (
    <Screen scroll>
      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg}}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Icon name="arrow-left" size={26} />
        </Pressable>
        <Txt variant="h2" style={{marginLeft: spacing.md, flex: 1}} numberOfLines={2}>
          {item.name}
        </Txt>
      </View>

      {fromScan && confidence != null ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            backgroundColor: theme.primarySoft,
            paddingHorizontal: spacing.md,
            paddingVertical: 6,
            borderRadius: radius.pill,
            marginBottom: spacing.lg,
          }}>
          <Icon name="camera-iris" size={16} color={theme.primary} />
          <Txt variant="label" tone="primary" style={{marginLeft: 6}}>
            AI scan · {Math.round(confidence * 100)}% match
          </Txt>
        </View>
      ) : null}

      <Card style={{alignItems: 'center'}}>
        <ProgressRing size={140} progress={1} color={theme.calories}>
          <Txt variant="display">{scaled.calories}</Txt>
          <Txt variant="caption" tone="muted">
            kcal
          </Txt>
        </ProgressRing>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignSelf: 'stretch',
            marginTop: spacing.lg,
          }}>
          <Macro label="Protein" value={scaled.protein} color={theme.protein} />
          <Macro label="Carbs" value={scaled.carbs} color={theme.carbs} />
          <Macro label="Fat" value={scaled.fat} color={theme.fat} />
        </View>
      </Card>

      {/* Amount */}
      <Txt variant="h3" style={{marginTop: spacing.xl, marginBottom: spacing.sm}}>
        Amount
      </Txt>
      <Input
        keyboardType="numeric"
        value={grams}
        onChangeText={setGrams}
        suffix="grams"
      />
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md}}>
        {PORTION_CHIPS.map(p => (
          <Chip
            key={p}
            label={`${p} g`}
            selected={g === p}
            onPress={() => setGrams(`${p}`)}
          />
        ))}
        {item.servingGrams ? (
          <Chip
            label={`1 serving (${item.servingGrams}g)`}
            selected={g === item.servingGrams}
            onPress={() => setGrams(`${item.servingGrams}`)}
          />
        ) : null}
      </View>

      {/* Meal */}
      <Txt variant="h3" style={{marginTop: spacing.xl, marginBottom: spacing.sm}}>
        Add to
      </Txt>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm}}>
        {MEALS.map(m => (
          <Chip
            key={m.value}
            icon={m.icon}
            label={m.label}
            selected={meal === m.value}
            onPress={() => setMeal(m.value)}
          />
        ))}
      </View>

      {/* Editable nutrition for manual items */}
      {isEditable ? (
        <Card style={{marginTop: spacing.xl}}>
          <Txt variant="label" tone="muted" style={{marginBottom: spacing.sm}}>
            NUTRITION PER 100 g
          </Txt>
          <View style={{flexDirection: 'row', gap: spacing.md}}>
            <Input
              label="Calories"
              keyboardType="numeric"
              value={per100.calories}
              onChangeText={t => setPer100({...per100, calories: t})}
              containerStyle={{flex: 1}}
            />
            <Input
              label="Protein"
              keyboardType="numeric"
              value={per100.protein}
              onChangeText={t => setPer100({...per100, protein: t})}
              containerStyle={{flex: 1}}
            />
          </View>
          <View style={{flexDirection: 'row', gap: spacing.md, marginTop: spacing.md}}>
            <Input
              label="Carbs"
              keyboardType="numeric"
              value={per100.carbs}
              onChangeText={t => setPer100({...per100, carbs: t})}
              containerStyle={{flex: 1}}
            />
            <Input
              label="Fat"
              keyboardType="numeric"
              value={per100.fat}
              onChangeText={t => setPer100({...per100, fat: t})}
              containerStyle={{flex: 1}}
            />
          </View>
        </Card>
      ) : null}

      <Button
        title="Add to diary"
        icon="check"
        onPress={save}
        full
        disabled={g <= 0}
        style={{marginTop: spacing.xl}}
      />
    </Screen>
  );
};

const Macro: React.FC<{label: string; value: number; color: string}> = ({
  label,
  value,
  color,
}) => (
  <View style={{alignItems: 'center'}}>
    <Txt variant="h2" color={color}>
      {round(value)}g
    </Txt>
    <Txt variant="caption" tone="muted">
      {label}
    </Txt>
  </View>
);

function num(s: string) {
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export default FoodDetailScreen;
