import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CategoryTreeService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Fetch the category tree
  getCategoryTree(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/categories`);
  }

  // Rearrange categories (drag-and-drop)
  rearrangeCategory(draggedId: number, parentId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/api/categories/rearrange`, { draggedId, parentId });
  }

   // Rename a category
  renameCategory(categoryId: number, newName: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/api/categories/${categoryId}`, { newName });
  }

  // Create a new category
  createCategory(name: string, parentCategoryId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/categories`, { name, parentCategoryId });
  }

  // Delete a category
  deleteCategory(categoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/categories/${categoryId}`);
  }
}