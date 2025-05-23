import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { AppComponent } from './app.component';
import { CategoryTreeComponent } from './category-tree/category-tree.component';

@NgModule({
  declarations: [
    AppComponent,
    CategoryTreeComponent, // Declare your components here
  ],
  imports: [
    BrowserModule, // Provides Angular's core browser functionality
    HttpClientModule, // For making HTTP requests in services
    CommonModule,
    CategoryTreeComponent 
  ],
  providers: [],
  bootstrap: [AppComponent], // Bootstraps the AppComponent
})
export class AppModule {}