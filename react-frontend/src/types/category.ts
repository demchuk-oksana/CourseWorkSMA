import { Artifact } from "./artifact";

export interface Category {
  id: number;
  name: string;
  parentCategoryId?: number | null;
  subcategories: Category[];
  artifacts?: Artifact[];
  isExpanded?: boolean;
}