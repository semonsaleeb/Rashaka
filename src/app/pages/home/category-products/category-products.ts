
import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Product, ProductService, Category } from '../../../services/product';

@Component({
  selector: 'app-category-products',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './category-products.html',
  styleUrls: ['./category-products.scss']
})
export class CategoryProducts implements OnInit {
  allProducts: Product[] = [];
  groupedProducts: Product[][] = [];
  isLoading = true;
  categories: Category[] = [];
  selectedCategory: number | 'all' = 'all';
  currentSlideIndex = 0;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.fetchProducts();
    this.handleResize();
  }

  @HostListener('window:resize')
  handleResize() {
    const screenWidth = window.innerWidth;
    let cardsPerSlide = 3; // Default for desktop
    
    if (screenWidth <= 576) {
      cardsPerSlide = 1; // Mobile
    } else if (screenWidth <= 992) {
      cardsPerSlide = 2; // Tablet
    }

    if (this.allProducts.length) {
      this.groupProducts(cardsPerSlide);
    }
  }

  private fetchProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.handleResize(); // Initial grouping
        this.categories = this.extractUniqueCategories(products);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this.isLoading = false;
      }
    });
  }

  private extractUniqueCategories(products: Product[]): Category[] {
    const categoryMap = new Map<number, Category>();
    products.forEach(product => {
      product.categories.forEach(category => {
        if (!categoryMap.has(category.id)) {
          categoryMap.set(category.id, category);
        }
      });
    });
    return Array.from(categoryMap.values());
  }

  filterByCategory(categoryId: number | 'all'): void {
    this.selectedCategory = categoryId;
    this.currentSlideIndex = 0;
    this.handleResize();
  }

  private groupProducts(itemsPerGroup: number): void {
    const filtered = this.selectedCategory === 'all'
      ? this.allProducts
      : this.allProducts.filter(p => p.categories.some(c => c.id === this.selectedCategory));

    const groups = [];
    for (let i = 0; i < filtered.length; i += itemsPerGroup) {
      groups.push(filtered.slice(i, i + itemsPerGroup));
    }
    this.groupedProducts = groups;
  }

  toggleFavorite(product: Product): void {
    product.isFavorite = !product.isFavorite;
  }

  addToCompare(product: Product): void {
    console.log('Added to compare:', product);
  }

  prevSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.groupedProducts.length) % this.groupedProducts.length;
  }

  nextSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.groupedProducts.length;
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
  }
}
