import { useState, useEffect, useCallback } from "react";
import { getCategoryTree } from "../api/categoryApi";
import { getArtifactsByCategory } from "../api/artifactApi";
import { Category } from "../types/category";
import { Artifact } from "../types/artifact";

// Recursively add artifacts: [] to every node in the tree
function addArtifactsField(categories: Category[]): Category[] {
  return categories.map(cat => ({
    ...cat,
    artifacts: [],
    subcategories: cat.subcategories ? addArtifactsField(cat.subcategories) : [],
  }));
}

// Recursively update the correct category node with the loaded artifacts
function updateCategoryArtifacts(
  categoryId: number,
  artifacts: Artifact[],
  nodes: Category[]
): Category[] {
  return nodes.map(cat => {
    if (cat.id === categoryId) {
      return { ...cat, artifacts };
    }
    if (cat.subcategories && cat.subcategories.length > 0) {
      return {
        ...cat,
        subcategories: updateCategoryArtifacts(categoryId, artifacts, cat.subcategories),
      };
    }
    return cat;
  });
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch and initialize category tree on mount
  useEffect(() => {
    setLoading(true);
    getCategoryTree()
      .then(data => setCategories(addArtifactsField(data)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Load artifacts for a category and update the tree
  const loadArtifactsForCategory = useCallback(
    async (categoryId: number) => {
      // Avoid reloading if already loaded (optional, can remove if you want reload)
      const findCategory = (nodes: Category[]): Category | undefined => {
        for (const cat of nodes) {
          if (cat.id === categoryId) return cat;
          if (cat.subcategories) {
            const found = findCategory(cat.subcategories);
            if (found) return found;
          }
        }
        return undefined;
      };
      const cat = findCategory(categories);
      if (cat && cat.artifacts && cat.artifacts.length > 0) return;

      const artifacts = await getArtifactsByCategory(categoryId);
      setCategories(prev =>
        updateCategoryArtifacts(categoryId, artifacts, prev)
      );
    },
    [categories]
  );

  return {
    categories,
    setCategories,
    loading,
    loadArtifactsForCategory,
  };
}