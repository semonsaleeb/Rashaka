import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Product, ProductService } from '../../../services/product';
import { map } from 'rxjs/operators';


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

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.fetchProducts();
  }

  private fetchProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.groupedProducts = this.chunkProducts(products, 3); // Group into slides of 3
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
  // In your component class
toggleFavorite(product: any) {
  product.isFavorite = !product.isFavorite;
  // Add your logic to handle favorites
}

addToCompare(product: any) {
  // Add your logic to handle comparison
}
}
