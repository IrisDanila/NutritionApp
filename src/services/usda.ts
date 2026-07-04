/**
 * Minimal client for the USDA FoodData Central API.
 * Docs: https://fdc.nal.usda.gov/api-guide.html
 *
 * We normalise every result to "per 100 g" macros plus an optional default
 * serving, so the rest of the app can scale freely.
 */
import {useAppStore} from '../store/useAppStore';

const BASE = 'https://api.nal.usda.gov/fdc/v1';

export interface UsdaMacros {
  calories: number; // kcal per 100 g
  carbs: number; // g per 100 g
  protein: number; // g per 100 g
  fat: number; // g per 100 g
}

export interface FoodItem extends UsdaMacros {
  fdcId: number;
  name: string;
  brand?: string;
  dataType?: string;
  /** Suggested serving size in grams, if the record provides one. */
  servingGrams?: number;
  servingLabel?: string;
}

interface RawNutrient {
  nutrientId?: number;
  nutrientNumber?: string;
  nutrientName?: string;
  unitName?: string;
  value?: number;
}

interface RawFood {
  fdcId: number;
  description: string;
  brandName?: string;
  brandOwner?: string;
  dataType?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: RawNutrient[];
}

function getApiKey(): string {
  return useAppStore.getState().settings.usdaApiKey || 'DEMO_KEY';
}

// USDA nutrientNumber codes (stable across data types).
const N_ENERGY = '208';
const N_PROTEIN = '203';
const N_FAT = '204';
const N_CARB = '205';

function pickNutrient(nutrients: RawNutrient[], num: string, names: string[]) {
  const byNum = nutrients.find(n => n.nutrientNumber === num);
  if (byNum?.value != null) return byNum.value;
  const byName = nutrients.find(n =>
    names.some(nm => (n.nutrientName ?? '').toLowerCase().includes(nm)),
  );
  return byName?.value ?? 0;
}

function normalize(raw: RawFood): FoodItem {
  const nutrients = raw.foodNutrients ?? [];
  // Energy may be reported in kcal (208) or, rarely, only kJ — convert.
  let calories = pickNutrient(nutrients, N_ENERGY, ['energy']);
  const kcalUnit = nutrients.find(
    n => n.nutrientNumber === N_ENERGY,
  )?.unitName?.toLowerCase();
  if (kcalUnit === 'kj') calories = calories / 4.184;

  return {
    fdcId: raw.fdcId,
    name: titleCase(raw.description),
    brand: raw.brandName || raw.brandOwner,
    dataType: raw.dataType,
    servingGrams:
      raw.servingSizeUnit === 'g' || raw.servingSizeUnit === 'GRM'
        ? raw.servingSize
        : undefined,
    servingLabel:
      raw.servingSize && raw.servingSizeUnit
        ? `${raw.servingSize} ${raw.servingSizeUnit}`
        : undefined,
    calories: round1(calories),
    protein: round1(pickNutrient(nutrients, N_PROTEIN, ['protein'])),
    fat: round1(pickNutrient(nutrients, N_FAT, ['lipid', 'fat'])),
    carbs: round1(pickNutrient(nutrients, N_CARB, ['carbohydrate'])),
  };
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

async function request<T>(path: string): Promise<T> {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${BASE}${path}${sep}api_key=${getApiKey()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`USDA ${res.status}: ${await safeText(res)}`);
  }
  return (await res.json()) as T;
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return res.statusText;
  }
}

export async function searchFoods(
  query: string,
  pageSize = 25,
): Promise<FoodItem[]> {
  if (!query.trim()) return [];
  const data = await request<{foods?: RawFood[]}>(
    `/foods/search?query=${encodeURIComponent(query)}&pageSize=${pageSize}` +
      `&dataType=${encodeURIComponent('Foundation,SR Legacy,Branded')}`,
  );
  return (data.foods ?? []).map(normalize);
}

export async function getFood(fdcId: number): Promise<FoodItem> {
  const data = await request<RawFood>(`/food/${fdcId}`);
  return normalize(data);
}

/** Scale a per-100g item to a given gram amount. */
export function scaleMacros(item: UsdaMacros, grams: number) {
  const f = grams / 100;
  return {
    calories: Math.round(item.calories * f),
    carbs: round1(item.carbs * f),
    protein: round1(item.protein * f),
    fat: round1(item.fat * f),
  };
}
