import axios from 'axios';
import { Category } from '../types/category';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5064/api';

/**
 * Fetches the full category tree with names and all subcategories.
 * This should be used for dropdowns and filters requiring category names.
 */
export const getCategoryTree = async (token?: string): Promise<Category[]> => {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const response = await axios.get<Category[]>(`${API_BASE_URL}/categories/tree`, { headers });
  return response.data;
};

/**
 * Fetches a flat list of all categories (id & name) for use in filters/dropdowns.
 * This walks the tree and flattens all categories into a single array.
 */
export const getCategories = async (token?: string): Promise<Category[]> => {
  const tree = await getCategoryTree(token);
  console.log('tree from API', tree); // <--- Add this line

  // Helper: Recursively flatten the tree
  function flatten(categories: Category[]): Category[] {
    return categories.flatMap(cat => [
      {
        id: cat.id,
        name: cat.name,
        parentCategoryId: cat.parentCategoryId,
        subcategories: [],
        artifacts: cat.artifacts,
        isExpanded: cat.isExpanded
      },
      ...(cat.subcategories ? flatten(cat.subcategories) : [])
    ]);
  }

  return flatten(tree);
};

export interface CategoryDto {
  name: string;
  parentCategoryId?: number | null;
}

export const createCategory = async (category: CategoryDto) => {
  const response = await axios.post(`${API_BASE_URL}/categories`, category);
  return response.data;
};

export const setCategoryDisplayPreference = async (categoryId: number, isExpanded: boolean, token: string) => {
  await axios.post(
    `${API_BASE_URL}/categories/${categoryId}/display`,
    isExpanded,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    }
  );
};