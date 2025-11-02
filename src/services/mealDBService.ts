import axios from 'axios';

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

export interface Meal {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags?: string;
  strYoutube?: string;
  [key: string]: any;
}

export interface MealCategory {
  idCategory: string;
  strCategory: string;
  strCategoryThumb: string;
  strCategoryDescription: string;
}

export const mealDBService = {
  searchMealByName: async (name: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/search.php?s=${name}`);
      return response.data.meals || [];
    } catch (error) {
      console.error('Error searching meals:', error);
      return [];
    }
  },

  getMealById: async (id: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/lookup.php?i=${id}`);
      return response.data.meals?.[0] || null;
    } catch (error) {
      console.error('Error fetching meal details:', error);
      return null;
    }
  },

  getRandomMeal: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/random.php`);
      return response.data.meals?.[0] || null;
    } catch (error) {
      console.error('Error fetching random meal:', error);
      return null;
    }
  },

  getMealCategories: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/categories.php`);
      return response.data.categories || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  filterByCategory: async (category: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/filter.php?c=${category}`);
      return response.data.meals || [];
    } catch (error) {
      console.error('Error filtering by category:', error);
      return [];
    }
  },

  filterByIngredient: async (ingredient: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/filter.php?i=${ingredient}`);
      return response.data.meals || [];
    } catch (error) {
      console.error('Error filtering by ingredient:', error);
      return [];
    }
  },

  filterByArea: async (area: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/filter.php?a=${area}`);
      return response.data.meals || [];
    } catch (error) {
      console.error('Error filtering by area:', error);
      return [];
    }
  },

  listAllAreas: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/list.php?a=list`);
      return response.data.meals || [];
    } catch (error) {
      console.error('Error listing areas:', error);
      return [];
    }
  },

  listAllIngredients: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/list.php?i=list`);
      return response.data.meals || [];
    } catch (error) {
      console.error('Error listing ingredients:', error);
      return [];
    }
  },
};
