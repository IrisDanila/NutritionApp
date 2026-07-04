import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  FlatList,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import IconButton from '../components/IconButton';
import Input from '../components/Input';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import {useTheme} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import {RootStackParamList} from '../navigation/types';
import {
  MealSummary,
  filterByCategory,
  listCategories,
  searchMeals,
} from '../services/mealdb';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const RecipesScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();

  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCat, setActiveCat] = useState('Chicken');
  const [meals, setMeals] = useState<MealSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => {});
  }, []);

  // Load by category when not searching.
  useEffect(() => {
    if (query.trim()) return;
    load(() => filterByCategory(activeCat));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCat]);

  // Debounced search.
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!query.trim()) {
      load(() => filterByCategory(activeCat));
      return;
    }
    debounce.current = setTimeout(() => load(() => searchMeals(query)), 450);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const load = async (fn: () => Promise<MealSummary[]>) => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const r = await fn();
      if (id === reqId.current) setMeals(r);
    } catch (e: any) {
      if (id === reqId.current) setError(e?.message ?? 'Failed to load recipes.');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  };

  return (
    <Screen padded={false}>
      <View style={{paddingHorizontal: spacing.lg, paddingTop: spacing.sm}}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md}}>
          <IconButton name="arrow-left" onPress={() => navigation.goBack()} />
          <Txt variant="h1" style={{marginLeft: spacing.sm}}>
            Recipes
          </Txt>
        </View>
        <Input
          placeholder="Search recipes (e.g. pasta)"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
      </View>

      {!query.trim() ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{marginTop: spacing.md, height: 52, flexGrow: 0}}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            gap: spacing.sm,
            alignItems: 'center',
          }}>
          {categories.map(item => (
            <Chip
              key={item}
              label={item}
              selected={item === activeCat}
              onPress={() => setActiveCat(item)}
            />
          ))}
        </ScrollView>
      ) : null}

      <FlatList
        data={meals}
        keyExtractor={m => m.id}
        numColumns={2}
        columnWrapperStyle={{gap: spacing.md, paddingHorizontal: spacing.lg}}
        contentContainerStyle={{paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md}}
        ListHeaderComponent={
          loading ? (
            <ActivityIndicator color={theme.primary} style={{marginVertical: spacing.lg}} />
          ) : error ? (
            <View style={{paddingHorizontal: spacing.lg}}>
              <Card flat style={{borderColor: theme.danger}}>
                <Txt tone="danger">{error}</Txt>
              </Card>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState icon="silverware-variant" title="No recipes" subtitle="Try another search or category." />
          ) : null
        }
        renderItem={({item}) => (
          <Pressable
            style={{flex: 1}}
            onPress={() => navigation.navigate('RecipeDetail', {id: item.id, name: item.name})}>
            <Card padded={false} style={{overflow: 'hidden', flex: 1}}>
              <Image source={{uri: item.thumb}} style={{width: '100%', height: 120}} resizeMode="cover" />
              <View style={{padding: spacing.md}}>
                <Txt variant="label" numberOfLines={2}>
                  {item.name}
                </Txt>
                {item.category ? (
                  <Txt variant="caption" tone="faint" style={{marginTop: 2}}>
                    {item.category}
                  </Txt>
                ) : null}
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
};

export default RecipesScreen;
