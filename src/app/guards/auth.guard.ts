import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

// ✅ Angular 15+ Standalone Style
export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  } else {
    // 📝 حفظ آخر URL المستخدم حاول يفتحه
    localStorage.setItem('redirectAfterLogin', state.url);
    router.navigate(['/login']);
    return false;
  }
};
