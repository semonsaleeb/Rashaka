import { Component } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ReactiveFormsModule, Validators, ValidationErrors, ValidatorFn } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router, RouterModule } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

declare var bootstrap: any;

// ---------------------
// Custom Validators
// ---------------------
export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasMinLength = value.length >= 8;

    return hasUpperCase && hasLowerCase && hasNumber && hasMinLength ? null : { weakPassword: true };
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class Register {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage: string | null = null;

  showPassword = false;
  showConfirmPassword = false;

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router, private authService: AuthService) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      // في الـ FormControl
      email: ['',
        [
          Validators.required,
          Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/), // ✅ تأكد من وجود @ و .
          Validators.maxLength(255)
        ],
        [this.verifiedEmailValidator()]
      ],

      // داخل FormControl
      phone: this.fb.control(
        '',
        {
          validators: [
            Validators.required,
            Validators.pattern(/^(01[0-9]{9}|(\+9665|05)[0-9]{8})$/)

          ],
          asyncValidators: [this.uniquePhoneValidator()],
          updateOn: 'blur'
        }
      ),

      password: ['', [Validators.required, strongPasswordValidator()]],
      password_confirmation: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirm = group.get('password_confirmation')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  togglePasswordVisibility() { this.showPassword = !this.showPassword; }
  toggleConfirmPasswordVisibility() { this.showConfirmPassword = !this.showConfirmPassword; }

  // ----------------------
  // Submit Registration
  // ----------------------
  onSubmit() {
    if (this.registerForm.invalid) {
      console.log('Form is invalid:', this.registerForm.value);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const formData = this.registerForm.value;
    console.log('Submitting registration with:', formData);

    this.http.post<any>(`${environment.apiBaseUrl}/register`, formData, {
      headers: new HttpHeaders({ 'Accept': 'application/json' })
    }).subscribe({
      next: (response) => {
        console.log('Registration response:', response);

        if (!response || !response.token || !response.client) {
          console.warn('Registration response does not contain token/client:', response);
          this.errorMessage = 'Registration failed: no token returned';
          this.loading = false;
          return;
        }

        // حفظ الـ token و client مباشرة
        localStorage.setItem('token', response.token);
        localStorage.setItem('client', JSON.stringify(response.client));

        // تحديث حالة AuthService
        this.authService.setLogin(response.token, response.client);

        console.log('User is now logged in with registration token');

        // عرض مودال النجاح
        const modalEl = document.getElementById('registerSuccessModal');
        if (modalEl) {
          const modal = new bootstrap.Modal(modalEl);
          modal.show();
        }

        this.registerForm.reset();
        this.loading = false;

        // تحويل المستخدم للصفحة الرئيسية
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error('Registration failed:', error);
        this.errorMessage = error?.error?.message || 'Registration failed.';
        this.loading = false;
      }
    });
  }

  registerUser() {
    this.successMessage = "تم التسجيل بنجاح!";
  }

  // ----------------------
  // Async Validators
  // ----------------------
  uniquePhoneValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) return of(null);

      return this.http.post<any>(`${environment.apiBaseUrl}/check-phone`, { phone: control.value }).pipe(
        map(response => response.exists ? { phoneTaken: true } : null),
        catchError(() => of(null))
      );
    };
  }

  verifiedEmailValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value || control.hasError('pattern')) {
        // لو فاضي أو مش مطابق للصيغة (بدون @ أو .) متعملش check
        return of(null);
      }

      return this.http.post<any>(`${environment.apiBaseUrl}/verify-email`, { email: control.value })
        .pipe(
          map(res => res.verified ? null : { emailNotVerified: true }),
          catchError(() => of(null))
        );
    };
  }


}
