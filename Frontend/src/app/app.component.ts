import { Component, OnInit } from '@angular/core';
import { ApiService } from './services/api.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http'; // Import HttpClientModule

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule, HttpClientModule], // Add HttpClientModule here
  standalone: true
})
export class AppComponent implements OnInit {
  exampleData: any;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    // Fetch data from the backend
    this.apiService.getExampleData().subscribe({
      next: (data) => this.exampleData = data,
      error: (error) => console.error('Error fetching data:', error)
    });
  }
}