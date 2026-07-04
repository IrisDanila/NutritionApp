/**
 * Food-101 class labels in the canonical HuggingFace `food101` ClassLabel
 * order (alphabetical, ASCII). This must match the fine-tuned model's
 * config.json id2label — if your model card lists a different order, replace
 * this array. (Verify with the model's config.json `id2label`.)
 */
export const FOOD101_LABELS: string[] = [
  'apple_pie', 'baby_back_ribs', 'baklava', 'beef_carpaccio', 'beef_tartare',
  'beet_salad', 'beignets', 'bibimbap', 'bread_pudding', 'breakfast_burrito',
  'bruschetta', 'caesar_salad', 'cannoli', 'caprese_salad', 'carrot_cake',
  'ceviche', 'cheese_plate', 'cheesecake', 'chicken_curry',
  'chicken_quesadilla', 'chicken_wings', 'chocolate_cake', 'chocolate_mousse',
  'churros', 'clam_chowder', 'club_sandwich', 'crab_cakes', 'creme_brulee',
  'croque_madame', 'cup_cakes', 'deviled_eggs', 'donuts', 'dumplings',
  'edamame', 'eggs_benedict', 'escargots', 'falafel', 'filet_mignon',
  'fish_and_chips', 'foie_gras', 'french_fries', 'french_onion_soup',
  'french_toast', 'fried_calamari', 'fried_rice', 'frozen_yogurt',
  'garlic_bread', 'gnocchi', 'greek_salad', 'grilled_cheese_sandwich',
  'grilled_salmon', 'guacamole', 'gyoza', 'hamburger', 'hot_and_sour_soup',
  'hot_dog', 'huevos_rancheros', 'hummus', 'ice_cream', 'lasagna',
  'lobster_bisque', 'lobster_roll_sandwich', 'macaroni_and_cheese', 'macarons',
  'miso_soup', 'mussels', 'nachos', 'omelette', 'onion_rings', 'oysters',
  'pad_thai', 'paella', 'pancakes', 'panna_cotta', 'peking_duck', 'pho',
  'pizza', 'pork_chop', 'poutine', 'prime_rib', 'pulled_pork_sandwich',
  'ramen', 'ravioli', 'red_velvet_cake', 'risotto', 'samosa', 'sashimi',
  'scallops', 'seaweed_salad', 'shrimp_and_grits', 'spaghetti_bolognese',
  'spaghetti_carbonara', 'spring_rolls', 'steak', 'strawberry_shortcake',
  'sushi', 'tacos', 'takoyaki', 'tiramisu', 'tuna_tartare', 'waffles',
];

/** Human-friendly display name for a raw label. */
export function prettyLabel(raw: string): string {
  return raw
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Good USDA search query for a label (the spaced version works well). */
export function usdaQueryFor(raw: string): string {
  return raw.replace(/_/g, ' ');
}

/** Typical eaten portion in grams, used to pre-fill the log amount. */
const PORTION_OVERRIDES: Record<string, number> = {
  pizza: 250,
  hamburger: 220,
  french_fries: 120,
  ice_cream: 100,
  donuts: 60,
  macarons: 20,
  sushi: 180,
  ramen: 450,
  pho: 500,
  miso_soup: 240,
  clam_chowder: 240,
  lobster_bisque: 240,
  hot_and_sour_soup: 240,
  french_onion_soup: 240,
  caesar_salad: 200,
  greek_salad: 200,
  beet_salad: 200,
  seaweed_salad: 100,
  caprese_salad: 150,
  guacamole: 60,
  hummus: 60,
  edamame: 100,
  spaghetti_bolognese: 350,
  spaghetti_carbonara: 350,
  macaroni_and_cheese: 250,
  lasagna: 300,
  risotto: 300,
  fried_rice: 250,
  paella: 300,
  pancakes: 150,
  waffles: 120,
  french_toast: 150,
  steak: 250,
  prime_rib: 280,
  filet_mignon: 220,
  pork_chop: 200,
  grilled_salmon: 180,
  hot_dog: 110,
  tacos: 150,
  nachos: 200,
  cheesecake: 120,
  chocolate_cake: 110,
  carrot_cake: 110,
  red_velvet_cake: 110,
  tiramisu: 120,
};

export function defaultPortionGrams(raw: string): number {
  return PORTION_OVERRIDES[raw] ?? 150;
}
