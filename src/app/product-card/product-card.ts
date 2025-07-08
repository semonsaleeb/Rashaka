import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Product } from '../services/product';
import { provideHttpClient } from '@angular/common/http';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, RouterModule, ],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss'
})
export class ProductCard {


  @Input() product!: Product;
}