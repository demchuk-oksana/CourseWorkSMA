import axios from 'axios';
import { Artifact } from '../types/artifact';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5064/api';

export interface ArtifactQuery {
  searchTerm?: string;
  programmingLanguage?: string;
  framework?: string;
  licenseType?: string;
  categoryId?: number;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

/**
 * Fetch artifacts by category.
 * @param categoryId number
 * @param query optional query parameters for filtering/pagination
 */
export const getArtifactsByCategory = async (
  categoryId: number,
  query: Partial<ArtifactQuery> = {}
): Promise<Artifact[]> => {
  const params = { ...query, categoryId };
  const response = await axios.get<Artifact[]>(`${API_BASE_URL}/artifacts`, { params });
  return response.data;
};