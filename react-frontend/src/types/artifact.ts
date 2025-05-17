export interface ArtifactVersion {
  versionNumber: string;
  changes: string;
  downloadUrl: string;
  uploadDate: string;
}

export interface ArtifactFeedback {
  // Add feedback fields as needed, e.g.:
  id: number;
  rating: number;
  comment: string;
  userId: number;
  // etc.
}

export interface User {
  id: number;
  username: string;
  // Add other user fields as needed
}

export interface Category {
  id: number;
  name: string;
  parentCategoryId?: number | null;
  // Add other category fields as needed
}

export interface Artifact {
  id: number;
  title: string;
  description: string;
  url: string;
  type: number; // DocumentationType, can be string or enum if you define one
  created: string;
  author: string;
  version: string;
  programmingLanguage: string;
  framework: string;
  licenseType: string;
  categoryId: number;
  category?: Category;
  uploaderId: number;
  uploader?: User;
  versions?: ArtifactVersion[];
  feedbacks?: ArtifactFeedback[];
}