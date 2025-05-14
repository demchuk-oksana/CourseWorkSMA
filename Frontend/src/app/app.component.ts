import { Component, OnInit } from '@angular/core';
import { ApiService } from './services/api.service';
import { CommonModule } from '@angular/common'; // Add this import

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule], // Add this line
  standalone: true // Add this line
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