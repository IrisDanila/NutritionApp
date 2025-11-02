// TypeScript: large (representative) food dataset with macros only
// NOTE: values are approximate typical serving averages (calories, protein_g, fat_g, carbs_g, fiber_g, sugar_g).
// Serving sizes are included in the `query` field. Emojis included where applicable.
export interface FoodItem {
  name: string;
  emoji?: string;
  query: string;
  nutrients: {
    calories: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    fiber_g: number;
    sugar_g: number;
  };
}

export const FOODS: FoodItem[] = [
  { name: "Apple", emoji: "🍎", query: "1 medium apple (182g)", nutrients: { calories: 95, protein_g: 0.5, fat_g: 0.3, carbs_g: 25, fiber_g: 4.4, sugar_g: 19 } },
  { name: "Banana", emoji: "🍌", query: "1 medium banana (118g)", nutrients: { calories: 105, protein_g: 1.3, fat_g: 0.3, carbs_g: 27, fiber_g: 3.1, sugar_g: 14 } },
  { name: "Orange", emoji: "🍊", query: "1 medium orange (131g)", nutrients: { calories: 62, protein_g: 1.2, fat_g: 0.2, carbs_g: 15.4, fiber_g: 3.1, sugar_g: 12 } },
  { name: "Strawberries", emoji: "🍓", query: "1 cup, halves (152g)", nutrients: { calories: 49, protein_g: 1.0, fat_g: 0.5, carbs_g: 11.7, fiber_g: 3.0, sugar_g: 7 } },
  { name: "Blueberries", emoji: "🫐", query: "1 cup (148g)", nutrients: { calories: 85, protein_g: 1.1, fat_g: 0.5, carbs_g: 21.4, fiber_g: 3.6, sugar_g: 15 } },
  { name: "Grapes", emoji: "🍇", query: "1 cup (151g)", nutrients: { calories: 104, protein_g: 1.1, fat_g: 0.2, carbs_g: 27.3, fiber_g: 1.4, sugar_g: 23 } },
  { name: "Avocado", emoji: "🥑", query: "1 medium avocado (150g)", nutrients: { calories: 240, protein_g: 3.0, fat_g: 22.0, carbs_g: 12.8, fiber_g: 10.0, sugar_g: 0.2 } },
  { name: "Tomato", emoji: "🍅", query: "1 medium tomato (123g)", nutrients: { calories: 22, protein_g: 1.1, fat_g: 0.25, carbs_g: 4.8, fiber_g: 1.5, sugar_g: 3.2 } },
  { name: "Cucumber", emoji: "🥒", query: "1 medium cucumber (301g)", nutrients: { calories: 45, protein_g: 2.0, fat_g: 0.3, carbs_g: 11, fiber_g: 1.5, sugar_g: 5 } },
  { name: "Broccoli", emoji: "🥦", query: "1 cup chopped (91g)", nutrients: { calories: 31, protein_g: 2.6, fat_g: 0.3, carbs_g: 6, fiber_g: 2.4, sugar_g: 1.5 } },
  { name: "Spinach", emoji: "🥬", query: "1 cup raw (30g)", nutrients: { calories: 7, protein_g: 0.9, fat_g: 0.1, carbs_g: 1.1, fiber_g: 0.7, sugar_g: 0.1 } },
  { name: "Kale", emoji: "🥬", query: "1 cup raw (21g)", nutrients: { calories: 7, protein_g: 0.6, fat_g: 0.1, carbs_g: 1.4, fiber_g: 0.9, sugar_g: 0.3 } },
  { name: "Carrot", emoji: "🥕", query: "1 medium carrot (61g)", nutrients: { calories: 25, protein_g: 0.6, fat_g: 0.1, carbs_g: 6, fiber_g: 1.7, sugar_g: 2.9 } },
  { name: "Bell Pepper (red)", emoji: "🫑", query: "1 medium (119g)", nutrients: { calories: 31, protein_g: 1.0, fat_g: 0.3, carbs_g: 6, fiber_g: 2.1, sugar_g: 4.2 } },
  { name: "Onion", emoji: "🧅", query: "1 medium (110g)", nutrients: { calories: 44, protein_g: 1.2, fat_g: 0.1, carbs_g: 10.3, fiber_g: 1.9, sugar_g: 4.7 } },
  { name: "Garlic", emoji: "🧄", query: "1 clove (3g)", nutrients: { calories: 4, protein_g: 0.2, fat_g: 0.0, carbs_g: 1, fiber_g: 0.1, sugar_g: 0.03 } },
  { name: "Potato (white)", emoji: "🥔", query: "1 medium (213g)", nutrients: { calories: 164, protein_g: 4.3, fat_g: 0.2, carbs_g: 37, fiber_g: 4.7, sugar_g: 2.0 } },
  { name: "Sweet Potato", emoji: "🍠", query: "1 medium (130g)", nutrients: { calories: 103, protein_g: 2.3, fat_g: 0.2, carbs_g: 24, fiber_g: 3.8, sugar_g: 7 } },
  { name: "Mushrooms (white)", emoji: "🍄", query: "1 cup sliced (70g)", nutrients: { calories: 15, protein_g: 2.2, fat_g: 0.2, carbs_g: 2.3, fiber_g: 0.7, sugar_g: 1.4 } },
  { name: "Lettuce (romaine)", emoji: "🥗", query: "1 cup shredded (47g)", nutrients: { calories: 8, protein_g: 0.6, fat_g: 0.1, carbs_g: 1.5, fiber_g: 1.0, sugar_g: 0.5 } },

  // Grains & cereals
  { name: "White Rice (cooked)", emoji: "🍚", query: "1 cup cooked (158g)", nutrients: { calories: 205, protein_g: 4.3, fat_g: 0.44, carbs_g: 45, fiber_g: 0.6, sugar_g: 0.1 } },
  { name: "Brown Rice (cooked)", emoji: "🍚", query: "1 cup cooked (195g)", nutrients: { calories: 216, protein_g: 5.0, fat_g: 1.8, carbs_g: 45, fiber_g: 3.5, sugar_g: 1 } },
  { name: "Quinoa (cooked)", query: "1 cup cooked (185g)", nutrients: { calories: 222, protein_g: 8.1, fat_g: 3.6, carbs_g: 39, fiber_g: 5.2, sugar_g: 1.6 } },
  { name: "Oatmeal (rolled oats, cooked)", emoji: "🥣", query: "1 cup cooked (234g)", nutrients: { calories: 154, protein_g: 6, fat_g: 3, carbs_g: 27, fiber_g: 4, sugar_g: 1 } },
  { name: "Bread (white slice)", query: "1 slice (25g)", nutrients: { calories: 66, protein_g: 2.0, fat_g: 1.0, carbs_g: 12, fiber_g: 0.6, sugar_g: 1.4 } },
  { name: "Bread (whole wheat slice)", query: "1 slice (28g)", nutrients: { calories: 69, protein_g: 3.6, fat_g: 1.1, carbs_g: 12, fiber_g: 2.0, sugar_g: 1.4 } },
  { name: "Pasta (cooked)", query: "1 cup cooked (140g)", nutrients: { calories: 221, protein_g: 8.1, fat_g: 1.3, carbs_g: 43, fiber_g: 2.5, sugar_g: 1.3 } },
  { name: "Corn (sweet, cooked)", emoji: "🌽", query: "1 cup (166g)", nutrients: { calories: 177, protein_g: 5.4, fat_g: 2.1, carbs_g: 41, fiber_g: 4.6, sugar_g: 6.4 } },
  { name: "Tortilla (corn)", query: "1 medium (28g)", nutrients: { calories: 52, protein_g: 1.3, fat_g: 0.8, carbs_g: 11, fiber_g: 1.4, sugar_g: 0.4 } },

  // Proteins: Poultry, meat, fish
  { name: "Chicken Breast (cooked)", emoji: "🍗", query: "100g cooked", nutrients: { calories: 165, protein_g: 31, fat_g: 3.6, carbs_g: 0, fiber_g: 0, sugar_g: 0 } },
  { name: "Chicken Thigh (cooked, skinless)", query: "100g", nutrients: { calories: 209, protein_g: 26, fat_g: 10.9, carbs_g: 0, fiber_g: 0, sugar_g: 0 } },
  { name: "Beef (ground, 85% lean, cooked)", query: "100g", nutrients: { calories: 250, protein_g: 26, fat_g: 17, carbs_g: 0, fiber_g: 0, sugar_g: 0 } },
  { name: "Pork Chop (cooked)", query: "100g", nutrients: { calories: 231, protein_g: 27, fat_g: 13, carbs_g: 0, fiber_g: 0, sugar_g: 0 } },
  { name: "Salmon (cooked)", emoji: "🐟", query: "100g cooked", nutrients: { calories: 208, protein_g: 22.1, fat_g: 13.4, carbs_g: 0, fiber_g: 0, sugar_g: 0 } },
  { name: "Tuna (canned in water)", emoji: "🐟", query: "100g drained", nutrients: { calories: 116, protein_g: 25.5, fat_g: 0.8, carbs_g: 0, fiber_g: 0, sugar_g: 0 } },
  { name: "Shrimp (cooked)", emoji: "🦐", query: "100g", nutrients: { calories: 99, protein_g: 24, fat_g: 0.3, carbs_g: 0.2, fiber_g: 0, sugar_g: 0 } },
  { name: "Turkey (breast, cooked)", query: "100g", nutrients: { calories: 135, protein_g: 29, fat_g: 1.6, carbs_g: 0, fiber_g: 0, sugar_g: 0 } },
  { name: "Lamb (leg, cooked)", query: "100g", nutrients: { calories: 250, protein_g: 25, fat_g: 17, carbs_g: 0, fiber_g: 0, sugar_g: 0 } },

  // Eggs & dairy
  { name: "Eggs (large)", emoji: "🥚", query: "2 large eggs (100g)", nutrients: { calories: 143, protein_g: 12.6, fat_g: 9.5, carbs_g: 1.1, fiber_g: 0, sugar_g: 1.1 } },
  { name: "Greek Yogurt (plain, nonfat)", emoji: "🥛", query: "1 cup (245g)", nutrients: { calories: 130, protein_g: 23, fat_g: 0, carbs_g: 9, fiber_g: 0, sugar_g: 9 } },
  { name: "Milk (whole)", query: "1 cup (244g)", nutrients: { calories: 149, protein_g: 7.7, fat_g: 8, carbs_g: 12, fiber_g: 0, sugar_g: 12 } },
  { name: "Cheddar Cheese", query: "1 slice (28g)", nutrients: { calories: 113, protein_g: 7.0, fat_g: 9.3, carbs_g: 0.4, fiber_g: 0, sugar_g: 0.1 } },
  { name: "Cottage Cheese (lowfat)", query: "1/2 cup (113g)", nutrients: { calories: 90, protein_g: 12.4, fat_g: 2.3, carbs_g: 3.4, fiber_g: 0, sugar_g: 2.7 } },

  // Legumes & pulses
  { name: "Lentils (cooked)", query: "1 cup (198g)", nutrients: { calories: 230, protein_g: 18, fat_g: 0.8, carbs_g: 39.9, fiber_g: 15.6, sugar_g: 3.6 } },
  { name: "Chickpeas (cooked)", query: "1 cup (164g)", nutrients: { calories: 269, protein_g: 14.5, fat_g: 4.2, carbs_g: 45, fiber_g: 12.5, sugar_g: 8 } },
  { name: "Black Beans (cooked)", query: "1 cup (172g)", nutrients: { calories: 227, protein_g: 15.2, fat_g: 0.9, carbs_g: 40.8, fiber_g: 15, sugar_g: 0.6 } },
  { name: "Kidney Beans (cooked)", query: "1 cup (177g)", nutrients: { calories: 225, protein_g: 15.3, fat_g: 0.9, carbs_g: 40.4, fiber_g: 13.6, sugar_g: 0.6 } },

  // Nuts & seeds
  { name: "Almonds", emoji: "🌰", query: "1 oz (28g)", nutrients: { calories: 164, protein_g: 6.0, fat_g: 14.2, carbs_g: 6.1, fiber_g: 3.5, sugar_g: 1.2 } },
  { name: "Walnuts", query: "1 oz (28g)", nutrients: { calories: 185, protein_g: 4.3, fat_g: 18.5, carbs_g: 3.9, fiber_g: 1.9, sugar_g: 0.7 } },
  { name: "Peanut Butter (smooth)", query: "2 tbsp (32g)", nutrients: { calories: 190, protein_g: 7.0, fat_g: 16.0, carbs_g: 7.0, fiber_g: 2.0, sugar_g: 3.0 } },
  { name: "Chia Seeds", query: "1 oz (28g)", nutrients: { calories: 138, protein_g: 4.7, fat_g: 8.7, carbs_g: 12.3, fiber_g: 10.6, sugar_g: 0 } },
  { name: "Flaxseeds", query: "1 tbsp (10g)", nutrients: { calories: 55, protein_g: 1.9, fat_g: 4.3, carbs_g: 3.0, fiber_g: 2.8, sugar_g: 0.2 } },

  // Oils & fats
  { name: "Olive Oil", emoji: "🫒", query: "1 tbsp (13.5g)", nutrients: { calories: 119, protein_g: 0, fat_g: 13.5, carbs_g: 0, fiber_g: 0, sugar_g: 0 } },
  { name: "Butter", query: "1 tbsp (14g)", nutrients: { calories: 102, protein_g: 0.12, fat_g: 11.5, carbs_g: 0.01, fiber_g: 0, sugar_g: 0.01 } },
  { name: "Coconut Oil", query: "1 tbsp (13.6g)", nutrients: { calories: 121, protein_g: 0, fat_g: 13.6, carbs_g: 0, fiber_g: 0, sugar_g: 0 } },

  // Snacks & sweets
  { name: "Dark Chocolate (70-85% cacao)", query: "1 oz (28g)", nutrients: { calories: 170, protein_g: 2.2, fat_g: 12.0, carbs_g: 13.0, fiber_g: 3.1, sugar_g: 7 } },
  { name: "Milk Chocolate", query: "1 oz (28g)", nutrients: { calories: 153, protein_g: 2.2, fat_g: 8.7, carbs_g: 17.0, fiber_g: 1.2, sugar_g: 15 } },
  { name: "Potato Chips", query: "1 oz (28g)", nutrients: { calories: 152, protein_g: 2.0, fat_g: 10.0, carbs_g: 15, fiber_g: 1.0, sugar_g: 0.2 } },
  { name: "Popcorn (air-popped)", query: "3 cups (24g)", nutrients: { calories: 93, protein_g: 3.1, fat_g: 1.1, carbs_g: 18.6, fiber_g: 3.6, sugar_g: 0.2 } },

  // Beverages (non-alcoholic)
  { name: "Coffee (black)", query: "1 cup (240g)", nutrients: { calories: 2, protein_g: 0.3, fat_g: 0, carbs_g: 0, fiber_g: 0, sugar_g: 0 } },
  { name: "Tea (black)", query: "1 cup (240g)", nutrients: { calories: 2, protein_g: 0.1, fat_g: 0, carbs_g: 0.0, fiber_g: 0, sugar_g: 0 } },
  { name: "Orange Juice (fresh)", query: "1 cup (248g)", nutrients: { calories: 112, protein_g: 1.7, fat_g: 0.5, carbs_g: 25.8, fiber_g: 0.5, sugar_g: 20 } },
  { name: "Soda (regular)", query: "12 fl oz (355ml)", nutrients: { calories: 140, protein_g: 0, fat_g: 0, carbs_g: 39, fiber_g: 0, sugar_g: 39 } },
  { name: "Beer (regular)", query: "12 fl oz (355ml)", nutrients: { calories: 153, protein_g: 1.6, fat_g: 0, carbs_g: 13, fiber_g: 0, sugar_g: 0 } },

  // Common prepared meals (approximations)
  { name: "Cheeseburger (fast food, single)", query: "1 sandwich (~200g)", nutrients: { calories: 303, protein_g: 15.5, fat_g: 14.0, carbs_g: 29, fiber_g: 1.5, sugar_g: 7 } },
  { name: "Margherita Pizza (1 slice, 1/8 of 12\" pie)", query: "1 slice (~107g)", nutrients: { calories: 285, protein_g: 12.0, fat_g: 10.0, carbs_g: 34, fiber_g: 2.7, sugar_g: 3.8 } },
  { name: "Caesar Salad (with dressing)", query: "1 serving (~250g)", nutrients: { calories: 470, protein_g: 10, fat_g: 41, carbs_g: 13, fiber_g: 3, sugar_g: 3 } },
  { name: "Spaghetti Bolognese", query: "1 plate (~400g)", nutrients: { calories: 680, protein_g: 28, fat_g: 22, carbs_g: 86, fiber_g: 6, sugar_g: 10 } },
  { name: "Chicken Caesar Wrap", query: "1 wrap (~300g)", nutrients: { calories: 520, protein_g: 33, fat_g: 21, carbs_g: 46, fiber_g: 4, sugar_g: 4 } },
  { name: "Sushi (assorted, 8 pieces)", query: "8 pieces (~200g)", nutrients: { calories: 320, protein_g: 12, fat_g: 6, carbs_g: 54, fiber_g: 3, sugar_g: 6 } },
  { name: "Greek Salad (no protein)", query: "1 serving (~250g)", nutrients: { calories: 220, protein_g: 4.5, fat_g: 18, carbs_g: 9, fiber_g: 2.5, sugar_g: 4 } },

  // Breakfast & common sides
  { name: "Pancakes (2 medium)", query: "2 medium pancakes (~150g)", nutrients: { calories: 175, protein_g: 4.0, fat_g: 4.5, carbs_g: 30, fiber_g: 1, sugar_g: 6 } },
  { name: "Maple Syrup", query: "2 tbsp (40g)", nutrients: { calories: 104, protein_g: 0, fat_g: 0, carbs_g: 26, fiber_g: 0, sugar_g: 25 } },
  { name: "Bagel (plain)", query: "1 medium (98g)", nutrients: { calories: 289, protein_g: 11, fat_g: 2.1, carbs_g: 56, fiber_g: 2.4, sugar_g: 5 } },
  { name: "Granola (store-bought)", query: "1/2 cup (55g)", nutrients: { calories: 220, protein_g: 4.5, fat_g: 8.0, carbs_g: 34, fiber_g: 4, sugar_g: 12 } },
  { name: "Waffles (ready-to-eat)", query: "1 waffle (75g)", nutrients: { calories: 218, protein_g: 4.4, fat_g: 11.0, carbs_g: 26, fiber_g: 1, sugar_g: 5 } },

  // Bakery & dessert
  { name: "Apple Pie (1/8 of 9\" pie)", query: "1 slice (~125g)", nutrients: { calories: 296, protein_g: 2.4, fat_g: 14.0, carbs_g: 41, fiber_g: 2, sugar_g: 20 } },
  { name: "Brownie (1 piece, 60g)", query: "1 piece (60g)", nutrients: { calories: 266, protein_g: 3.0, fat_g: 12.0, carbs_g: 36, fiber_g: 2, sugar_g: 26 } },

  // Frozen & convenience
  { name: "Frozen Peas (cooked)", query: "1 cup (160g)", nutrients: { calories: 134, protein_g: 8.6, fat_g: 0.6, carbs_g: 25, fiber_g: 8.8, sugar_g: 9 } },
  { name: "Frozen Mixed Vegetables", query: "1 cup (160g)", nutrients: { calories: 118, protein_g: 4.6, fat_g: 0.8, carbs_g: 22, fiber_g: 6, sugar_g: 6 } },

  // Seafood & shellfish specifics
  { name: "Cod (cooked)", query: "100g", nutrients: { calories: 105, protein_g: 23, fat_g: 0.9, carbs_g: 0, fiber_g: 0, sugar_g: 0 } },
  { name: "Trout (cooked)", query: "100g", nutrients: { calories: 148, protein_g: 20.8, fat_g: 6.7, carbs_g: 0, fiber_g: 0, sugar_g: 0 } },

  // Ethnic staples
  { name: "Hummus", query: "2 tbsp (30g)", nutrients: { calories: 70, protein_g: 2.0, fat_g: 5.0, carbs_g: 4.0, fiber_g: 1.0, sugar_g: 0.1 } },
  { name: "Falafel (fried)", query: "3 pieces (~85g)", nutrients: { calories: 333, protein_g: 9.3, fat_g: 17, carbs_g: 35, fiber_g: 6, sugar_g: 2 } },
  { name: "Naan Bread", query: "1 piece (100g)", nutrients: { calories: 300, protein_g: 8, fat_g: 6, carbs_g: 54, fiber_g: 2, sugar_g: 6 } },

  // Common condiments (small servings)
  { name: "Ketchup", query: "1 tbsp (17g)", nutrients: { calories: 19, protein_g: 0.2, fat_g: 0, carbs_g: 5, fiber_g: 0.1, sugar_g: 4 } },
  { name: "Mayonnaise", query: "1 tbsp (14g)", nutrients: { calories: 94, protein_g: 0.0, fat_g: 10.0, carbs_g: 0.1, fiber_g: 0, sugar_g: 0.1 } },
  { name: "Soy Sauce", query: "1 tbsp (15g)", nutrients: { calories: 9, protein_g: 1.0, fat_g: 0, carbs_g: 1.0, fiber_g: 0, sugar_g: 0.1 } },

  // More fruits
  { name: "Pear", query: "1 medium (178g)", nutrients: { calories: 101, protein_g: 0.6, fat_g: 0.2, carbs_g: 27, fiber_g: 6, sugar_g: 17 } },
  { name: "Pineapple", emoji: "🍍", query: "1 cup chunks (165g)", nutrients: { calories: 82, protein_g: 0.9, fat_g: 0.2, carbs_g: 22, fiber_g: 2.3, sugar_g: 16 } },
  { name: "Mango", emoji: "🥭", query: "1 medium (207g)", nutrients: { calories: 201, protein_g: 2.6, fat_g: 1.3, carbs_g: 50, fiber_g: 5.4, sugar_g: 46 } },

  // More vegetables
  { name: "Zucchini", query: "1 medium (196g)", nutrients: { calories: 33, protein_g: 2.4, fat_g: 0.6, carbs_g: 6.1, fiber_g: 2.2, sugar_g: 4 } },
  { name: "Eggplant (aubergine)", query: "1 cup cooked (82g)", nutrients: { calories: 35, protein_g: 0.8, fat_g: 0.2, carbs_g: 8.6, fiber_g: 2.5, sugar_g: 3.2 } },

  // Dairy alternatives
  { name: "Almond Milk (unsweetened)", query: "1 cup (240g)", nutrients: { calories: 30, protein_g: 1.0, fat_g: 2.5, carbs_g: 1, fiber_g: 0, sugar_g: 0 } },
  { name: "Soy Milk (unsweetened)", query: "1 cup (243g)", nutrients: { calories: 80, protein_g: 7, fat_g: 4, carbs_g: 4, fiber_g: 1, sugar_g: 1 } },

  // More grains / seeds
  { name: "Buckwheat (cooked)", query: "1 cup (168g)", nutrients: { calories: 155, protein_g: 5.7, fat_g: 1.0, carbs_g: 33.5, fiber_g: 4.5, sugar_g: 0.6 } },
  { name: "Barley (cooked)", query: "1 cup (157g)", nutrients: { calories: 193, protein_g: 3.5, fat_g: 0.7, carbs_g: 44, fiber_g: 6, sugar_g: 0.3 } },

  // More proteins & processed items
  { name: "Tofu (firm)", query: "100g", nutrients: { calories: 76, protein_g: 8.1, fat_g: 4.8, carbs_g: 1.9, fiber_g: 0.3, sugar_g: 0.3 } },
  { name: "Tempeh", query: "100g", nutrients: { calories: 193, protein_g: 20.3, fat_g: 10.8, carbs_g: 7.6, fiber_g: 1.4, sugar_g: 0.5 } },
  { name: "Sausage (pork, cooked)", query: "1 link (75g)", nutrients: { calories: 270, protein_g: 9, fat_g: 24, carbs_g: 3, fiber_g: 0, sugar_g: 1 } },

  // Convenience breakfast proteins
  { name: "Bacon (cooked)", query: "3 slices (34g)", nutrients: { calories: 161, protein_g: 12, fat_g: 12, carbs_g: 0.6, fiber_g: 0, sugar_g: 0 } },
  { name: "Sausage Patty (pork)", query: "1 patty (57g)", nutrients: { calories: 197, protein_g: 6.5, fat_g: 18.5, carbs_g: 1.5, fiber_g: 0, sugar_g: 0.5 } },

  // Ready-to-eat salads / bowls (approximations)
  { name: "Burrito (bean and rice, medium)", query: "1 burrito (~300g)", nutrients: { calories: 580, protein_g: 16, fat_g: 18, carbs_g: 88, fiber_g: 10, sugar_g: 4 } },
  { name: "Bowl (rice, chicken, veggies)", query: "1 bowl (~450g)", nutrients: { calories: 620, protein_g: 36, fat_g: 18, carbs_g: 68, fiber_g: 6, sugar_g: 7 } },

  // Misc / spices (per small serving)
  { name: "Honey", query: "1 tbsp (21g)", nutrients: { calories: 64, protein_g: 0.0, fat_g: 0, carbs_g: 17.3, fiber_g: 0, sugar_g: 17 } },
  { name: "Brown Sugar", query: "1 tbsp (13g)", nutrients: { calories: 52, protein_g: 0, fat_g: 0, carbs_g: 13.5, fiber_g: 0, sugar_g: 12 } },

  // Vegetarian/vegan alternatives
  { name: "Seitan", query: "100g", nutrients: { calories: 370, protein_g: 75, fat_g: 1.9, carbs_g: 14, fiber_g: 0.6, sugar_g: 0.4 } },

  // Quick additions for coverage
  { name: "Mac and Cheese (boxed, prepared)", query: "1 cup (~200g)", nutrients: { calories: 310, protein_g: 10, fat_g: 12, carbs_g: 40, fiber_g: 2, sugar_g: 5 } },
  { name: "Beef Steak (sirloin, cooked)", query: "100g", nutrients: { calories: 250, protein_g: 26, fat_g: 17, carbs_g: 0, fiber_g: 0, sugar_g: 0 } },
  { name: "Pancetta (cured pork)", query: "1 oz (28g)", nutrients: { calories: 147, protein_g: 8.0, fat_g: 12.0, carbs_g: 0.0, fiber_g: 0, sugar_g: 0 } },

  // Sweets / pastries
  { name: "Croissant", query: "1 medium (57g)", nutrients: { calories: 231, protein_g: 4.8, fat_g: 12.0, carbs_g: 26.0, fiber_g: 1.2, sugar_g: 6 } },

  // More legumes & sides
  { name: "Edamame (shelled, cooked)", query: "1 cup (155g)", nutrients: { calories: 188, protein_g: 18.5, fat_g: 8.1, carbs_g: 13.8, fiber_g: 8.1, sugar_g: 3.4 } },

  // More seafood
  { name: "Clams (cooked)", query: "100g", nutrients: { calories: 148, protein_g: 25.5, fat_g: 2.0, carbs_g: 5.1, fiber_g: 0, sugar_g: 0 } },

  // Asian staples
  { name: "Tofu Stir-fry (1 plate)", query: "1 plate (~350g)", nutrients: { calories: 420, protein_g: 22, fat_g: 20, carbs_g: 30, fiber_g: 6, sugar_g: 8 } },

  // Pizza / fast-food variations
  { name: "Pepperoni Pizza (1 slice, 1/8 of 14\")", query: "1 slice (~140g)", nutrients: { calories: 340, protein_g: 14, fat_g: 16, carbs_g: 32, fiber_g: 2, sugar_g: 4 } },

  // International grains / breads
  { name: "Pita Bread (white)", query: "1 medium (60g)", nutrients: { calories: 165, protein_g: 5.5, fat_g: 1.0, carbs_g: 33, fiber_g: 1.5, sugar_g: 1.5 } },

  // Misc proteins
  { name: "Venison (cooked)", query: "100g", nutrients: { calories: 157, protein_g: 30, fat_g: 3.2, carbs_g: 0, fiber_g: 0, sugar_g: 0 } },

  // Final handful common items
  { name: "Ice Cream (vanilla)", query: "1/2 cup (66g)", nutrients: { calories: 137, protein_g: 2.3, fat_g: 7.3, carbs_g: 16, fiber_g: 0, sugar_g: 14 } },
  { name: "Cereal (corn flakes)", query: "1 cup (28g)", nutrients: { calories: 100, protein_g: 2.0, fat_g: 0.1, carbs_g: 24, fiber_g: 1, sugar_g: 2 } },
  { name: "Pesto Sauce", query: "2 tbsp (32g)", nutrients: { calories: 160, protein_g: 1.5, fat_g: 16.0, carbs_g: 2.0, fiber_g: 0.5, sugar_g: 0.5 } }
];
