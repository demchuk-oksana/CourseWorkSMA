import axios from 'axios';
import { Category } from '../types/category';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5064/api';

export const getCategoryTree = async (token?: string): Promise<Category[]> => {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  const response = await axios.get<Category[]>(`${API_BASE_URL}/categories/tree`, { headers });
  const tree = response.data;

  // Helper to recursively fetch artifacts for all categories
  const fetchArtifactsRecursively = async (categories: Category[]): Promise<Category[]> => {
    return Promise.all(categories.map(async (cat) => {
      let artifacts = [];
      try {
        const artRes = await axios.get(`${API_BASE_URL}/artifacts?CategoryId=${cat.id}`, { headers });
        artifacts = artRes.data;
      } catch (e: any) {
        // Treat 404 as "no artifacts", ignore it
        if (e?.response?.status !== 404) {
          console.error("Failed to fetch artifacts for category", cat.id, e);
        }
        artifacts = [];
      }
      // Recursively fetch subcategories, always ensure it's an array
      const subcategories = Array.isArray(cat.subcategories)
        ? await fetchArtifactsRecursively(cat.subcategories)
        : [];
      return {
        ...cat,
        artifacts,
        subcategories,
      };
    }));
  };

  return fetchArtifactsRecursively(tree);
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

