import { Routes } from '@angular/router';

// Lazy-loaded standalone components
import { Auth } from './auth/auth';
import { Profile } from './auth/profile/profile'; // standalone
import { SpecialOffersComponent } from './pages/home/special-offers/special-offers';
import { CategoryProducts } from './pages/home/category-products/category-products';
import { SucesStory } from './pages/home/suces-story/suces-story';
import { Blogs } from './pages/home/blogs/blogs';
import { CartIconComponent } from './cart-icon.component/cart-icon.component';
import { CartPageComponent } from './cart-page.component/cart-page.component';
import { Pricing } from './pages/home/pricing/pricing';
import { ProductCard } from './product-card/product-card';
import { OurService } from './pages/home/our-service/our-service';

export const routes: Routes = [
  // Home page
  {
    path: '',
    loadComponent: () => import('./pages/home').then(m => m.Home)
  },

  // Auth wrapper (optional: use this if you want nested auth routes)
  {
    path: 'auth',
    component: Auth,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./auth/login/login').then(m => m.Login)
      },
      {
        path: 'register',
        loadComponent: () => import('./auth/register/register').then(m => m.Register)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./auth/forgot-password/forgot-password').then(m => m.ForgotPassword)
      },
      {
        path: 'verify-otp',
        loadComponent: () => import('./auth/verify-otp/verify-otp').then(m => m.VerifyOtp)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./auth/reset-password/reset-password').then(m => m.ResetPassword)
      }


    ]
  },

  // Profile also directly accessible from /profile (optional mirror)
  {
    path: 'profile',
    loadComponent: () => import('./auth/profile/profile').then(m => m.Profile)
  },

  // Optional direct route to login (outside /auth)
  {
    path: 'login',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./auth/forgot-password/forgot-password').then(m => m.ForgotPassword)
  },
   {
        path: 'verify-otp',
        loadComponent: () => import('./auth/verify-otp/verify-otp').then(m => m.VerifyOtp)
      },
       {
        path: 'reset-password',
        loadComponent: () => import('./auth/reset-password/reset-password').then(m => m.ResetPassword)
      },
{
  path: 'reset-password-done',
  loadComponent: () => import('./auth/reset-password-done/reset-password-done')
    .then(m => m.ResetPasswordDone)
}
,


      

  // Category Products
  {
    path: 'home/category-products',
    component: CategoryProducts
  },
  {
    path: 'home/Pricing',
    component: Pricing
  },
  

   {
    path: 'home/sucesStory',
    component: SucesStory
  },
   {
    path: 'home/ourService',
    component: OurService
  },
 {
  path: 'home/special-offers',
  component: SpecialOffersComponent,
  data: { mode: 'grid' }
}

,
  {
    path: 'home/blogs',
    component: Blogs
  },
   {
    path: 'cart',
    component: CartPageComponent
  },
  { path: 'product/:id', component: ProductCard },


  // Fallback route
  {
    path: '**',
    redirectTo: ''
  }
  
];
