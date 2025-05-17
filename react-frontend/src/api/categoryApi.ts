import axios from 'axios';
import { Category } from '../types/category';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5064/api';

/**
 * Fetch the category tree from the backend.
 * Note: This only returns categories, not artifacts. Artifacts should be fetched separately per category.
 */
export const getCategoryTree = async (): Promise<Category[]> => {
  const response = await axios.get<Category[]>(`${API_BASE_URL}/categories/tree`);
  // Each category will have an empty artifacts array; artifacts must be populated separately.
  return response.data.map(cat => ({
    ...cat,
    artifacts: []
  }));
};

// If you want to create a category, here's a helper (optional)
export interface CategoryDto {
  name: string;
  parentCategoryId?: number | null;
}

export const createCategory = async (category: CategoryDto) => {
  const response = await axios.post(`${API_BASE_URL}/categories`, category);
  return response.data;
};