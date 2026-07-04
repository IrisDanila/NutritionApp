/**
 * Client for TheMealDB (https://www.themealdb.com/api.php).
 * Free, no key required (the public test key "1" is used).
 */
const BASE = 'https://www.themealdb.com/api/json/v1/1';

export interface MealSummary {
  id: string;
  name: string;
  thumb: string;
  category?: string;
  area?: string;
}

export interface MealIngredient {
  name: string;
  measure: string;
}

export interface Meal extends MealSummary {
  instructions: string;
  youtube?: string;
  source?: string;
  tags: string[];
  ingredients: MealIngredient[];
}

interface RawMeal {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strCategory?: string;
  strArea?: string;
  strInstructions?: string;
  strYoutube?: string;
  strSource?: string;
  strTags?: string | null;
  [key: string]: string | null | undefined;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`TheMealDB ${res.status}`);
  return (await res.json()) as T;
}

function toSummary(m: RawMeal): MealSummary {
  return {
    id: m.idMeal,
    name: m.strMeal,
    thumb: m.strMealThumb,
    category: m.strCategory || undefined,
    area: m.strArea || undefined,
  };
}

function toMeal(m: RawMeal): Meal {
  const ingredients: MealIngredient[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = (m[`strIngredient${i}`] || '').toString().trim();
    const measure = (m[`strMeasure${i}`] || '').toString().trim();
    if (name) ingredients.push({name, measure});
  }
  return {
    ...toSummary(m),
    instructions: (m.strInstructions || '').trim(),
    youtube: m.strYoutube || undefined,
    source: m.strSource || undefined,
    tags: m.strTags ? m.strTags.split(',').map(t => t.trim()).filter(Boolean) : [],
    ingredients,
  };
}

export async function searchMeals(query: string): Promise<MealSummary[]> {
  if (!query.trim()) return [];
  const data = await get<{meals: RawMeal[] | null}>(
    `/search.php?s=${encodeURIComponent(query)}`,
  );
  return (data.meals ?? []).map(toSummary);
}

export async function filterByCategory(category: string): Promise<MealSummary[]> {
  const data = await get<{meals: RawMeal[] | null}>(
    `/filter.php?c=${encodeURIComponent(category)}`,
  );
  // filter.php returns only id/name/thumb.
  return (data.meals ?? []).map(toSummary);
}

export async function listCategories(): Promise<string[]> {
  const data = await get<{categories: {strCategory: string}[]}>('/categories.php');
  return (data.categories ?? []).map(c => c.strCategory);
}

export async function randomMeal(): Promise<Meal | null> {
  const data = await get<{meals: RawMeal[] | null}>('/random.php');
  return data.meals?.[0] ? toMeal(data.meals[0]) : null;
}

export async function lookupMeal(id: string): Promise<Meal | null> {
  const data = await get<{meals: RawMeal[] | null}>(`/lookup.php?i=${id}`);
  return data.meals?.[0] ? toMeal(data.meals[0]) : null;
}
