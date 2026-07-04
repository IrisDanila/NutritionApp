import React, {useEffect, useRef, useState} from 'react';
import {View, FlatList, ActivityIndicator, Pressable} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Screen from '../components/Screen';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import Card from '../components/Card';
import Input from '../components/Input';
import EmptyState from '../components/EmptyState';
import {useTheme} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import {searchFoods, FoodItem} from '../services/usda';
import {RootStackParamList} from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'FoodSearch'>;

export const FoodSearchScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const meal = route.params?.meal;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounce.current = setTimeout(async () => {
      const id = ++reqId.current;
      try {
        const r = await searchFoods(query, 25);
        if (id === reqId.current) {
          setResults(r);
          setError(null);
        }
      } catch (e: any) {
        if (id === reqId.current) setError(e?.message ?? 'Search failed.');
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 450);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query]);

  const openManual = () => {
    navigation.navigate('FoodDetail', {
      item: {
        fdcId: -1,
        name: query.trim() || 'Custom food',
        calories: 0,
        carbs: 0,
        protein: 0,
        fat: 0,
        dataType: 'manual',
      },
      meal,
    });
  };

  return (
    <Screen padded={false}>
      <View style={{padding: spacing.lg, paddingBottom: spacing.sm}}>
        <Input
          placeholder="Search foods (e.g. greek yogurt)"
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={i => `${i.fdcId}`}
        contentContainerStyle={{padding: spacing.lg, paddingTop: spacing.sm}}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          loading ? (
            <ActivityIndicator color={theme.primary} style={{marginVertical: spacing.lg}} />
          ) : error ? (
            <Card style={{borderColor: theme.danger, marginBottom: spacing.md}}>
              <Txt tone="danger">{error}</Txt>
            </Card>
          ) : null
        }
        ListEmptyComponent={
          !loading && query.trim().length >= 2 ? (
            <EmptyState
              icon="food-off"
              title="No matches"
              subtitle="Try a simpler term, or add it manually below."
            />
          ) : query.trim().length < 2 ? (
            <EmptyState
              icon="magnify"
              title="Find any food"
              subtitle="Search the USDA FoodData Central database of hundreds of thousands of foods."
            />
          ) : null
        }
        renderItem={({item}) => (
          <Pressable
            onPress={() => navigation.navigate('FoodDetail', {item, meal})}
            style={({pressed}) => ({opacity: pressed ? 0.7 : 1})}>
            <Card style={{marginBottom: spacing.sm}} padded={false}>
              <View style={{flexDirection: 'row', alignItems: 'center', padding: spacing.md}}>
                <View style={{flex: 1}}>
                  <Txt variant="bodyLg" numberOfLines={1}>
                    {item.name}
                  </Txt>
                  <Txt variant="caption" tone="muted">
                    {item.brand ? `${item.brand} · ` : ''}
                    {Math.round(item.calories)} kcal / 100g · {item.dataType}
                  </Txt>
                </View>
                <Icon name="plus-circle" size={22} color={theme.primary} />
              </View>
            </Card>
          </Pressable>
        )}
        ListFooterComponent={
          <Pressable onPress={openManual} style={{marginTop: spacing.md}}>
            <Card style={{borderStyle: 'dashed', borderColor: theme.border}}>
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                <Icon name="pencil-plus" size={20} color={theme.textMuted} />
                <Txt tone="muted" style={{marginLeft: spacing.sm}}>
                  Add custom / manual entry
                </Txt>
              </View>
            </Card>
          </Pressable>
        }
      />
    </Screen>
  );
};

export default FoodSearchScreen;
