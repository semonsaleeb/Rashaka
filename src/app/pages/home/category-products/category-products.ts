import { Component, OnInit } from '@angular/core';
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

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.fetchProducts();
  }

  private fetchProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (products: Product[]) => {
        this.allProducts = products;
        this.filterByCategory('all');

        const categoryMap: Record<number, Category> = {};
        products.forEach((product: Product) => {
          product.categories.forEach((cat: Category) => {
            categoryMap[cat.id] = cat;
          });
        });

        this.categories = Object.values(categoryMap);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Failed to load products:', err);
        this.isLoading = false;
      }
    });
  }

  filterByCategory(categoryId: number | 'all'): void {
    this.selectedCategory = categoryId;
    if (categoryId === 'all') {
      this.groupedProducts = this.chunkProducts(this.allProducts, 3);
    } else {
      const filtered = this.allProducts.filter(product =>
        product.categories.some(cat => cat.id === categoryId)
      );
      this.groupedProducts = this.chunkProducts(filtered, 3);
    }
  }

  private chunkProducts(arr: Product[], size: number): Product[][] {
    const result: Product[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }
 // In your component class
toggleFavorite(product: any) {
  product.isFavorite = !product.isFavorite;
  // Add your logic to handle favorites
}

addToCompare(product: any) {
  // Add your logic to handle comparison
}
}
