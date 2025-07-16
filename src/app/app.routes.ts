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
    path: 'category-products',
    component: CategoryProducts
  },

   {
    path: 'home/sucesStory',
    component: SucesStory
  },
  {
    path: 'home/special-offers',
    component: SpecialOffersComponent
  },
  {
    path: 'home/blogs',
    component: Blogs
  },
   {
    path: 'cart',
    component: CartPageComponent
  },

//   {
//   path: 'cart',
//   loadComponent: () =>
//     import('./cart-icon.component/cart-icon.component').then(m => m.CartIconComponent)
// },
// {
//   path: 'cart',
//   loadComponent: () =>
//     import('./pages/cart-page/cart-page.component').then(m => m.CartPageComponent)
// }

  // {
  //   path: 'home/blogs',
  //   loadComponent: () => import('./pages/home/blogs/blogs').then(m => m.Blogs)
  // },

  // Fallback route
  {
    path: '**',
    redirectTo: ''
  }
  
];
