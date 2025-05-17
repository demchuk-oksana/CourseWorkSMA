import { useState, useEffect, useCallback } from "react";
import { getCategoryTree } from "../api/categoryApi";
import { getArtifactsByCategory } from "../api/artifactApi";
import { Category } from "../types/category";
import { Artifact } from "../types/artifact";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Load category tree on mount
  useEffect(() => {
    setLoading(true);
    getCategoryTree()
      .then(data => setCategories(data))
      .finally(() => setLoading(false));
  }, []);

  // Recursive helper to update artifacts for a category by id
  const updateCategoryArtifacts = useCallback(
    (categoryId: number, artifacts: Artifact[], nodes: Category[]): Category[] => {
      return nodes.map(cat => {
        if (cat.id === categoryId) {
          return { ...cat, artifacts };
        }
        if (cat.subcategories && cat.subcategories.length > 0) {
          return { ...cat, subcategories: updateCategoryArtifacts(categoryId, artifacts, cat.subcategories) };
        }
        return cat;
      });
    },
    []
  );

  // Load artifacts for a category and update the tree
  const loadArtifactsForCategory = useCallback(
    async (categoryId: number) => {
      const artifacts = await getArtifactsByCategory(categoryId);
      setCategories(prev =>
        updateCategoryArtifacts(categoryId, artifacts, prev)
      );
    },
    [updateCategoryArtifacts]
  );

  return {
    categories,
    setCategories,
    loading,
    loadArtifactsForCategory,
  };
}