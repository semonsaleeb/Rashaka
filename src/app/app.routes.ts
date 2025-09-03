import { Routes } from '@angular/router';

// Standalone Components
import { Auth } from './auth/auth';
import { Profile } from './auth/profile/profile';
import { SpecialOffersComponent } from './pages/home/special-offers/special-offers';
import { CategoryProducts } from './pages/home/category-products/category-products';
import { SucesStory } from './pages/home/suces-story/suces-story';
import { Blogs } from './pages/home/blogs/blogs';
import { CartPageComponent } from './cart-page.component/cart-page.component';
import { Pricing } from './pages/home/pricing/pricing';
import { ProductCard } from './product-card/product-card';
import { OurService } from './pages/home/our-service/our-service';
import { SingleBlog } from './single-blog/single-blog';
import { Details } from './auth/profile/details/details';
import { Orders } from './auth/profile/orders/orders';
import { Reservation } from './auth/profile/reservation/reservation';
import { Address } from './auth/profile/address/address';
import { PlaceOrder } from './place-order/place-order';
import { Favorites } from './favorites/favorites';
import { AboutUs } from './pages/about-us/about-us';
import { PackagePricingOrder } from './package-pricing-order/package-pricing-order';
import { Branches } from './pages/home/branches/branches';
import { Appointments } from './pages/appointments/appointments';
import { Packages } from './auth/profile/packages/packages';

export const routes: Routes = [
  // Home page
  {
    path: '',
    loadComponent: () => import('./pages/home').then(m => m.Home)
  },

  // Authentication Routes
  {
    path: 'auth',
    component: Auth,
    children: [
      { path: 'login', loadComponent: () => import('./auth/login/login').then(m => m.Login) },
      { path: 'register', loadComponent: () => import('./auth/register/register').then(m => m.Register) },
      { path: 'forgot-password', loadComponent: () => import('./auth/forgot-password/forgot-password').then(m => m.ForgotPassword) },
      { path: 'verify-otp', loadComponent: () => import('./auth/verify-otp/verify-otp').then(m => m.VerifyOtp) },
      { path: 'reset-password', loadComponent: () => import('./auth/reset-password/reset-password').then(m => m.ResetPassword) },
      { path: 'reset-password-done', loadComponent: () => import('./auth/reset-password-done/reset-password-done').then(m => m.ResetPasswordDone) }
    ]
  },

  // Direct access to some auth pages (optional)
  { path: 'login', redirectTo: 'auth/login', pathMatch: 'full' },
  { path: 'forgot-password', loadComponent: () => import('./auth/forgot-password/forgot-password').then(m => m.ForgotPassword) },
  { path: 'verify-otp', loadComponent: () => import('./auth/verify-otp/verify-otp').then(m => m.VerifyOtp) },
  { path: 'reset-password', loadComponent: () => import('./auth/reset-password/reset-password').then(m => m.ResetPassword) },
  { path: 'reset-password-done', loadComponent: () => import('./auth/reset-password-done/reset-password-done').then(m => m.ResetPasswordDone) },

  // Profile Routes
  {
    path: 'profile',
    component: Profile,
    children: [
      { path: '', redirectTo: 'details', pathMatch: 'full' },
      { path: 'details', component: Details },
      { path: 'reservations', component: Reservation },
      { path: 'packages', component: Packages },
      { path: 'addresses', component: Address },
      { path: 'orders', component: Orders }, 
    ]
  },

  // Shop & Content Pages
  { path: 'home/category-products', component: CategoryProducts },
  { path: 'home/packages', component: Pricing },
  { path: 'home/sucesStory', component: SucesStory },
  { path: 'home/ourService', component: OurService },
  { path: 'home/special-offers', component: SpecialOffersComponent, data: { mode: 'grid' } },
  { path: 'home/blogs', component: Blogs },
  { path: 'home/blog/:id', component: SingleBlog },
  { path: 'home/branches', component: Branches },


  // Cart & Favorites
  { path: 'cart', component: CartPageComponent },
  { path: 'product/:id', component: ProductCard },
  { path: 'placeOrder', component: PlaceOrder },
  { path: 'favorites', component: Favorites },
  { path: 'package-pricing-order', component: PackagePricingOrder },
  // Other Pages
  { path: 'about_us', component: AboutUs },
  { path: 'reservation', component: Appointments },
  { path: 'reservation/:id', component: Appointments },


  // Fallback
  { path: '**', redirectTo: '' }
];
