import React, {useEffect, useState} from 'react';
import {View, Image, ActivityIndicator, Linking, Pressable} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Txt from '../components/Txt';
import Icon from '../components/Icon';
import IconButton from '../components/IconButton';
import Button from '../components/Button';
import Chip from '../components/Chip';
import {useTheme} from '../theme/ThemeContext';
import {radius, spacing} from '../theme/typography';
import {RootStackParamList} from '../navigation/types';
import {Meal, lookupMeal} from '../services/mealdb';

type Rt = RouteProp<RootStackParamList, 'RecipeDetail'>;

export const RecipeDetailScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation();
  const route = useRoute<Rt>();
  const {id} = route.params;

  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lookupMeal(id)
      .then(setMeal)
      .catch(() => setMeal(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={theme.primary} style={{marginTop: spacing.xxxl}} size="large" />
      </Screen>
    );
  }

  if (!meal) {
    return (
      <Screen>
        <IconButton name="arrow-left" onPress={() => navigation.goBack()} />
        <Txt tone="muted" center style={{marginTop: spacing.xl}}>
          Couldn't load this recipe.
        </Txt>
      </Screen>
    );
  }

  return (
    <Screen scroll padded={false}>
      <View style={{position: 'relative'}}>
        <Image source={{uri: meal.thumb}} style={{width: '100%', height: 260}} resizeMode="cover" />
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            position: 'absolute',
            top: spacing.lg,
            left: spacing.lg,
            backgroundColor: theme.overlay,
            borderRadius: radius.pill,
            padding: spacing.sm,
          }}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </Pressable>
      </View>

      <View style={{padding: spacing.lg}}>
        <Txt variant="h1">{meal.name}</Txt>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md}}>
          {meal.category ? <Chip label={meal.category} icon="tag" /> : null}
          {meal.area ? <Chip label={meal.area} icon="earth" color={theme.accent} /> : null}
          {meal.tags.slice(0, 3).map(t => (
            <Chip key={t} label={t} color={theme.protein} />
          ))}
        </View>

        {meal.youtube ? (
          <Button
            title="Watch on YouTube"
            icon="youtube"
            variant="secondary"
            full
            onPress={() => Linking.openURL(meal.youtube!)}
            style={{marginTop: spacing.lg}}
          />
        ) : null}

        <Txt variant="h2" style={{marginTop: spacing.xl, marginBottom: spacing.md}}>
          Ingredients
        </Txt>
        <Card padded={false} style={{paddingHorizontal: spacing.lg}}>
          {meal.ingredients.map((ing, i) => (
            <View
              key={`${ing.name}-${i}`}
              style={[
                {flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm},
                i < meal.ingredients.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                },
              ]}>
              <Icon name="circle-small" size={20} color={theme.primary} />
              <Txt style={{flex: 1, marginLeft: 4}}>{ing.name}</Txt>
              <Txt tone="muted" variant="caption">
                {ing.measure}
              </Txt>
            </View>
          ))}
        </Card>

        <Txt variant="h2" style={{marginTop: spacing.xl, marginBottom: spacing.md}}>
          Instructions
        </Txt>
        <Card>
          <Txt style={{lineHeight: 22}}>{meal.instructions}</Txt>
        </Card>

        {meal.source ? (
          <Button
            title="Original source"
            icon="open-in-new"
            variant="ghost"
            full
            onPress={() => Linking.openURL(meal.source!)}
            style={{marginTop: spacing.lg}}
          />
        ) : null}
      </View>
    </Screen>
  );
};

export default RecipeDetailScreen;
