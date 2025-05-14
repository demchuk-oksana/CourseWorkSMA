import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Example: Fetch data from the backend
  getExampleData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/example`); // Adjust the endpoint as per your API
  }

  // Example: Send data to the backend
  postExampleData(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/example`, data);
  }
}