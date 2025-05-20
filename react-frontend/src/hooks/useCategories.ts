import { useState, useEffect, useCallback } from "react";
import { getCategoryTree } from "../api/categoryApi";
import { getAllArtifacts } from "../api/artifactApi";
import { Category } from "../types/category";
import { Artifact } from "../types/artifact";

function assignArtifactsToCategories(categories: Category[], artifacts: Artifact[]): Category[] {
  return categories.map(category => {
    const myArtifacts = artifacts.filter(a => a.categoryId === category.id);
    const updatedSubcategories = category.subcategories
      ? assignArtifactsToCategories(category.subcategories, artifacts)
      : [];
    return {
      ...category,
      artifacts: myArtifacts,
      subcategories: updatedSubcategories,
    };
  });
}

export function useCategories(token?: string) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      getCategoryTree(token),
      getAllArtifacts(token)
    ])
      .then(([categoryTree, artifacts]) => {
        setCategories(assignArtifactsToCategories(categoryTree, artifacts));
      })
      .finally(() => setLoading(false));
  }, [token]);

  const reload = useCallback(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      getCategoryTree(token),
      getAllArtifacts(token)
    ])
      .then(([categoryTree, artifacts]) => {
        setCategories(assignArtifactsToCategories(categoryTree, artifacts));
      })
      .finally(() => setLoading(false));
  }, [token]);

  return {
    categories,
    setCategories,
    loading,
    reload,
  };
}