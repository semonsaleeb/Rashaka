import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-orders',
  imports: [],
  templateUrl: './orders.html',
  styleUrl: './orders.scss'
})
export class Orders {
constructor(private router: Router) {}

goToPackages() {
  this.router.navigate(['/home/packages']);
}
}
