import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:5064/api'; // Update the base API URL here

  constructor(private http: HttpClient) {}

  // Method to fetch the category tree
  getCategoryTree(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/categories/tree`);
  }

  // Example: Send data to the backend
  postExampleData(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/example`, data);
  }
}