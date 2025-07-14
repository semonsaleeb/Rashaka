import { Routes } from '@angular/router';
import { SpecialOffersComponent } from './pages/home/special-offers/special-offers';
import { CategoryProducts } from './pages/home/category-products/category-products';
import { Auth } from './auth/auth';

export const routes: Routes = [



  {
    path: '',
    loadComponent: () => import('./pages/home').then(m => m.Home)
  },

  {
    path: 'auth',
    component: Auth,
  },
  
  {
    path: 'category',
    redirectTo: '/category-products',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./auth/login/login').then(m => m.Login)
  },
];