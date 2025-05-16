export interface Artifact {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  parentCategoryId?: number | null;
  subcategories: Category[];
  artifacts: Artifact[];
  isExpanded?: boolean;
}