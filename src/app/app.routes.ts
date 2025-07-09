import { Routes } from '@angular/router';
import { SpecialOffersComponent } from './pages/home/special-offers/special-offers';
import { CategoryProducts } from './pages/home/category-products/category-products';

export const routes: Routes = [
 
  // { 
  //   path: 'category-products', 
  //   component: CategoryProducts 
  // },
 // Add a default route if needed
 {
  path: 'offers',
  loadComponent: () => import('./pages/home/special-offers/special-offers').then(m => m.SpecialOffersComponent)
},
{
  path: 'category',
  redirectTo: '/category-products',
  pathMatch: 'full'
}

];