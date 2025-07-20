import { Component, HostListener, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Product, ProductService, Category } from '../../../services/product';
import { CartService } from '../../../services/cart.service';
import { CartStateService } from '../../../services/cart-state-service';

@Component({
  selector: 'app-category-products',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, FormsModule],
  templateUrl: './category-products.html',
  styleUrls: ['./category-products.scss']
})
export class CategoryProducts implements OnInit {
  @Input() mode: 'grid' | 'carousel' = 'grid';

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  groupedProducts: Product[][] = [];

  isLoading = true;
  categories: Category[] = [];
  selectedCategories: number[] = [];

  currentSlideIndex = 0;
  searchQuery = '';
  priceMin: number | null = null;
  priceMax: number | null = null;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public cartState: CartStateService
  ) {}

  ngOnInit(): void {
    this.fetchProducts();
    this.handleResize();
  }

  @HostListener('window:resize')
  handleResize(): void {
    const screenWidth = window.innerWidth;
    let cardsPerSlide = 3;

    if (screenWidth <= 576) {
      cardsPerSlide = 1;
    } else if (screenWidth <= 992) {
      cardsPerSlide = 2;
    }

    if (this.mode === 'carousel') {
      this.groupProducts(cardsPerSlide);
    }
  }

  private fetchProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.allProducts = products;
        this.categories = this.extractUniqueCategories(products);
        this.applyCombinedFilters();
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

  applyCombinedFilters(): void {
    this.filteredProducts = this.allProducts.filter(p => {
      const matchesCategory =
        this.selectedCategories.length === 0 ||
        p.categories.some(c => this.selectedCategories.includes(c.id));

      const matchesSearch = p.name_ar.includes(this.searchQuery);

      const price = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
      const meetsMin = this.priceMin === null || price >= this.priceMin;
      const meetsMax = this.priceMax === null || price <= this.priceMax;

      return matchesCategory && matchesSearch && meetsMin && meetsMax;
    });

    if (this.mode === 'carousel') {
      this.handleResize();
    }
  }

  toggleCategory(categoryId: number): void {
    if (this.selectedCategories.includes(categoryId)) {
      this.selectedCategories = this.selectedCategories.filter(id => id !== categoryId);
    } else {
      this.selectedCategories.push(categoryId);
    }
    this.applyCombinedFilters();
  }

  removeCategory(categoryId: number): void {
    this.selectedCategories = this.selectedCategories.filter(id => id !== categoryId);
    this.applyCombinedFilters();
  }

  getCategoryName(id: number): string {
    const cat = this.categories.find(c => c.id === id);
    return cat ? cat.name_ar : '';
  }

  clearAllCategories(): void {
    this.selectedCategories = [];
    this.applyCombinedFilters();
  }

  filterBySearch(): void {
    this.applyCombinedFilters();
  }

  applyPriceFilter(): void {
    this.applyCombinedFilters();
  }

  // Carousel
  private groupProducts(itemsPerGroup: number): void {
    const groups: Product[][] = [];
    for (let i = 0; i < this.filteredProducts.length; i += itemsPerGroup) {
      groups.push(this.filteredProducts.slice(i, i + itemsPerGroup));
    }
    this.groupedProducts = groups;
  }

  prevSlide(): void {
    if (this.groupedProducts.length === 0) return;
    this.currentSlideIndex =
      (this.currentSlideIndex - 1 + this.groupedProducts.length) % this.groupedProducts.length;
  }

  nextSlide(): void {
    if (this.groupedProducts.length === 0) return;
    this.currentSlideIndex =
      (this.currentSlideIndex + 1) % this.groupedProducts.length;
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
  }

  // Cart
  addToCart(productId: number): void {
    this.cartService.addToCart(productId).subscribe({
      next: (res) => {
        console.log('Product added successfully', res);
        this.refreshCartCount();
      },
      error: (err) => {
        console.error('Failed to add to cart', err);
      }
    });
  }

  refreshCartCount(): void {
    this.cartService.getCart().subscribe(response => {
      const count = response.data.items.reduce((total, item) => total + item.quantity, 0);
      this.cartState.updateCount(count);
    });
  }

  toggleFavorite(product: Product): void {
    product.isFavorite = !product.isFavorite;
  }

  addToCompare(product: Product): void {
    console.log('Added to compare:', product);
  }


  selectedCategory: number | 'all' = 'all';

filterByCategory(categoryId: number | 'all'): void {
  this.selectedCategory = categoryId;
  if (categoryId === 'all') {
    this.filteredProducts = [...this.allProducts];
  } else {
    this.filteredProducts = this.allProducts.filter(product =>
      product.categories.some(c => c.id === categoryId)
    );
  }

  // Re-group for carousel
  if (this.mode === 'carousel') {
    this.handleResize();
  }
}

  predefinedRanges = [
    { label: '0-1000', min: 0, max: 1000, selected: false },
    { label: '1000-1500', min: 1000, max: 1500, selected: false },
    { label: '1500-2000', min: 1500, max: 2000, selected: false },
    { label: '2000-2500', min: 2000, max: 2500, selected: false }
  ];

  applyPredefinedRange(index: number) {
    this.predefinedRanges[index].selected = !this.predefinedRanges[index].selected;

    // Collect all selected ranges
    const selectedRanges = this.predefinedRanges.filter(r => r.selected);

    // Optional: apply the widest range
    if (selectedRanges.length > 0) {
      const allMins = selectedRanges.map(r => r.min);
      const allMaxs = selectedRanges.map(r => r.max);

      this.priceMin = Math.min(...allMins);
      this.priceMax = Math.max(...allMaxs);
    } else {
      this.priceMin = 0;
      this.priceMax = 0;
    }

    this.applyPriceFilter();
  }

}