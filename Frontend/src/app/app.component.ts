import { Component, OnInit } from '@angular/core';
import { ApiService } from './services/api.service';
import { CommonModule } from '@angular/common'; 
import { HttpClientModule } from '@angular/common/http'; 

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [CommonModule, HttpClientModule], 
  standalone: true
})
export class AppComponent implements OnInit {
  categoryTree: any[] = []; // Holds the category tree data
  errorMessage: string | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    // Fetch the category tree
    this.apiService.getCategoryTree().subscribe({
      next: (data) => {
        this.categoryTree = data; // Assign the data to the tree variable
        console.log('Category Tree:', this.categoryTree);
      },
      error: (error) => {
        this.errorMessage = 'Failed to load category tree.';
        console.error('Error:', error);
      },
    });
  }
}