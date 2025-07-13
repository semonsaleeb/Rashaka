import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Product, ProductService } from '../../../services/product';

@Component({
  selector: 'app-special-offers',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './special-offers.html',
  styleUrls: ['./special-offers.scss'],
  providers: [ProductService]
})
export class SpecialOffersComponent implements OnInit {
  products: Product[] = [];
  groupedProducts: Product[][] = [];
  isLoading = true;

  currentSlideIndex = 0;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.fetchProducts();
  }

  private fetchProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.groupedProducts = this.chunkProducts(products, 3); // 3 cards per slide
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load products:', err);
        this.isLoading = false;
      }
    });
  }

  private chunkProducts(arr: Product[], size: number): Product[][] {
    const result: Product[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  }

  toggleFavorite(product: Product) {
    product.isFavorite = !product.isFavorite;
  }

  addToCompare(product: Product) {
    console.log('Compare:', product);
  }

  prevSlide() {
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.groupedProducts.length) % this.groupedProducts.length;
  }

  nextSlide() {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.groupedProducts.length;
  }

  goToSlide(index: number) {
    this.currentSlideIndex = index;
  }
}
