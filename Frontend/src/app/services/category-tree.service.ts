import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoryTreeService {
  private apiUrl = 'http://localhost:5064/api/categories'; // Adjust to your backend URL

  constructor(private http: HttpClient) {}

  getCategoryTree(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tree`);
  }

  rearrangeCategory(categoryId: number, newParentId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/rearrange`, {
      categoryId,
      newParentId
    });
  }
}