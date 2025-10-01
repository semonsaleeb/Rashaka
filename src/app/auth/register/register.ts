import { Component } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ReactiveFormsModule, Validators, ValidationErrors, ValidatorFn } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router, RouterModule } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

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
  imports: [ReactiveFormsModule, RouterModule, CommonModule, TranslateModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class Register {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage: string | null = null;
  apiErrors: any = {}; // كائن لتخزين أخطاء API


  currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl'; // ← default direction

    ngOnInit(): void {

  // Set initial language
  this.currentLang = this.languageService.getCurrentLanguage();
  this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

  // Subscribe to language changes
  this.languageService.currentLang$.subscribe(lang => {
    this.currentLang = lang;
    this.dir = lang === 'ar' ? 'rtl' : 'ltr';
  });
}
  constructor(private translate: TranslateService, private languageService: LanguageService,private fb: FormBuilder, private http: HttpClient, private router: Router, private authService: AuthService) {
   
   
   
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(8),Validators.maxLength(255)]],
      email: ['',
        [
          Validators.required,
          Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
          Validators.maxLength(255)
        ],
        [this.verifiedEmailValidator()]
      ],
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

  showPassword = false;
  showConfirmPassword = false;
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
    this.apiErrors = {}; // مسح الأخطاء السابقة

    const formData = this.registerForm.value;
    console.log('Submitting registration with:', formData);

    this.http.post<any>(`${environment.apiBaseUrl}/register`, formData, {
      headers: new HttpHeaders({ 'Accept': 'application/json' })
    }).subscribe({
      next: (response) => {
        console.log('Registration response:', response);

        if (!response || !response.token || !response.client) {
          console.warn('Registration response does not contain token/client:', response);
          this.apiErrors.general = 'Registration failed: no token returned';
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
        
        // معالجة أخطاء API
        if (error.error && error.error.errors) {
          // استخراج الأخطاء من الاستجابة
          const apiErrors = error.error.errors;
          this.apiErrors = {};
          
          // تعيين الأخطاء لكل حقل
          for (const field in apiErrors) {
            if (apiErrors.hasOwnProperty(field)) {
              // أخذ أول خطأ فقط لكل حقل
              this.apiErrors[field] = apiErrors[field][0];
            }
          }
          
          // إذا لم يكن هناك أخطاء محددة للحقول، عرض خطأ عام
          if (Object.keys(this.apiErrors).length === 0) {
            this.apiErrors.general = error.error.message || 'Registration failed.';
          }
        } else {
          this.apiErrors.general = error.error?.message || 'Registration failed.';
        }
        
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