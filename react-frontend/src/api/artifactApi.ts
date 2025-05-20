import axios from "axios";
import { Artifact } from "../types/artifact";
import qs from "qs";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5064/api';

export type ArtifactApiResponse = {
  data: Artifact[];
  pagination: {
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
};

/**
 * Fetch all artifacts (used for extracting unique filter options client-side).
 * Handles paginated backend that returns { data: Artifact[], pagination: ... }
 */
export const getAllArtifacts = async (
  token: string
): Promise<Artifact[]> => {
  const response = await axios.get(`${API_BASE_URL}/artifacts`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data;
};

/**
 * Fetch artifacts with filtering, paging, and sorting.
 * Uses qs to serialize arrays as repeated parameters (no brackets).
 */
export const getArtifacts = async (
  query: any,
  token: string
): Promise<ArtifactApiResponse> => {
  const response = await axios.get(`${API_BASE_URL}/artifacts`, {
    headers: { Authorization: `Bearer ${token}` },
    params: query,
    paramsSerializer: params => qs.stringify(params, { arrayFormat: "repeat" }),
  });
  return response.data;
};

export const getArtifactById = async (
  id: number,
  token: string
): Promise<Artifact> => {
  const response = await axios.get(`${API_BASE_URL}/artifacts/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const createArtifact = async (
  artifact: Omit<Artifact, "id">,
  token: string
): Promise<Artifact> => {
  const response = await axios.post(`${API_BASE_URL}/artifacts`, artifact, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateArtifact = async (
  id: number,
  artifact: Partial<Artifact>,
  token: string
): Promise<Artifact> => {
  const response = await axios.put(`${API_BASE_URL}/artifacts/${id}`, artifact, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deleteArtifact = async (
  id: number,
  token: string
): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/artifacts/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};