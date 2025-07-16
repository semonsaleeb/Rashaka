import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { CartStateService } from '../../services/cart-state-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  @Output() forgot = new EventEmitter<void>();

  email = '';
  password = '';
  errorMessage = '';
  loading = false;

  constructor(private http: HttpClient, private router: Router,   private authService: AuthService, private cartService: CartService,private cartState: CartStateService,) {}

 login() {
  this.errorMessage = '';
  this.loading = true;

  const payload = { email: this.email, password: this.password };
  const headers = new HttpHeaders({ Accept: 'application/json' });

  this.http.post<any>(`${environment.apiBaseUrl}/login`, payload, { headers }).subscribe({
    next: (res) => {
      if (res.token && res.client) {
        // ✅ Store token and client info
        this.authService.setLogin(res.token, res.client);

        // ✅ Update cart count
        this.cartService.getCart().subscribe({
          next: (cartResponse) => {
            const count = cartResponse.data.items.reduce((total: number, item: any) => total + item.quantity, 0);
            this.cartState.updateCount(count);
          },
          error: (err) => console.error('Error fetching cart after login', err)
        });

        // ✅ Optionally refresh favorite count
        // this.favoriteService.loadFavorites(); // if your service supports this

        // ✅ Navigate to profile
        this.router.navigate(['/profile']);
      } else {
        this.errorMessage = 'بيانات تسجيل الدخول غير صحيحة.';
      }

      this.loading = false;
    },
    error: (err) => {
      this.loading = false;
      this.errorMessage = err.error?.message || 'فشل تسجيل الدخول. تأكد من صحة البيانات.';
    }
  });
}



    showPassword = false;

togglePasswordVisibility() {
  this.showPassword = !this.showPassword;
}

}
