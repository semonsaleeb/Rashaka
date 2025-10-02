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

  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private translate: TranslateService, 
    private languageService: LanguageService,
    private fb: FormBuilder, 
    private http: HttpClient, 
    private router: Router, 
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      name: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.maxLength(255),
        Validators.pattern(/^[\u0600-\u06FFa-zA-Z\s]+$/) // ✅ اسم عربي/إنجليزي فقط
      ]],
      email: ['', [
        Validators.required,
        Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
        Validators.maxLength(255),
        Validators.email
      ], [this.verifiedEmailValidator()]],
      phone: this.fb.control('', {
        validators: [
          Validators.required,
          Validators.pattern(/^(01[0-9]{9}|(\+9665|05)[0-9]{8})$/),
          Validators.minLength(10),
          Validators.maxLength(14)
        ],
        asyncValidators: [this.uniquePhoneValidator()],
        updateOn: 'blur'
      }),
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.maxLength(128),
        strongPasswordValidator()
      ]],
      password_confirmation: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(128)
      ]],
    }, { 
      validators: [
        this.passwordMatchValidator,
        this.noWhitespaceValidator // ✅ منع المسافات البيضاء
      ] 
    });
  }

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

  // ✅ تأكيد تطابق كلمة المرور
  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirm = group.get('password_confirmation')?.value;
    
    if (!password || !confirm) return null;
    
    return password === confirm ? null : { mismatch: true };
  }

  // ✅ منع المسافات البيضاء في الحقول
  noWhitespaceValidator(group: FormGroup) {
    const name = group.get('name')?.value;
    const email = group.get('email')?.value;
    const phone = group.get('phone')?.value;
    
    const errors: any = {};
    
    if (name && /^\s|\s$/.test(name)) {
      errors.nameWhitespace = true;
    }
    
    if (email && /^\s|\s$/.test(email)) {
      errors.emailWhitespace = true;
    }
    
    if (phone && /^\s|\s$/.test(phone)) {
      errors.phoneWhitespace = true;
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }

  togglePasswordVisibility() { 
    this.showPassword = !this.showPassword; 
  }
  
  toggleConfirmPasswordVisibility() { 
    this.showConfirmPassword = !this.showConfirmPassword; 
  }

  // ----------------------
  // Submit Registration
  // ----------------------
  onSubmit() {
    // ✅ تنظيف البيانات من المسافات البيضاء
    this.cleanFormData();

    if (this.registerForm.invalid) {
      console.log('Form is invalid:', this.registerForm.errors);
      this.markAllFieldsAsTouched();
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

  // ✅ تنظيف البيانات من المسافات البيضاء
  private cleanFormData() {
    const formValues = this.registerForm.value;
    
    Object.keys(formValues).forEach(key => {
      if (typeof formValues[key] === 'string') {
        formValues[key] = formValues[key].trim();
      }
    });
    
    this.registerForm.patchValue(formValues);
  }

  // ✅ وضع touched على جميع الحقول لعرض الأخطاء
  private markAllFieldsAsTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
  }

  // ----------------------
  // Async Validators
  // ----------------------
  uniquePhoneValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value || control.hasError('pattern')) {
        return of(null);
      }

      const cleanPhone = control.value.trim();
      if (!cleanPhone) return of(null);

      return this.http.post<any>(`${environment.apiBaseUrl}/check-phone`, { phone: cleanPhone }).pipe(
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

      const cleanEmail = control.value.trim();
      if (!cleanEmail) return of(null);

      return this.http.post<any>(`${environment.apiBaseUrl}/verify-email`, { email: cleanEmail })
        .pipe(
          map(res => res.verified ? null : { emailNotVerified: true }),
          catchError(() => of(null))
        );
    };
  }

  // ✅ دالة مساعدة للتحقق من صحة الحقل
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || field.dirty));
  }

  // ✅ دالة للحصول على رسالة الخطأ
  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors) return '';

    const errors = field.errors;
    
    if (errors['required']) return 'هذا الحقل مطلوب';
    if (errors['minlength']) return `الحد الأدنى ${errors['minlength'].requiredLength} حرف`;
    if (errors['maxlength']) return `الحد الأقصى ${errors['maxlength'].requiredLength} حرف`;
    if (errors['pattern']) {
      switch(fieldName) {
        case 'name': return 'الاسم يجب أن يحتوي على أحرف عربية أو إنجليزية فقط';
        case 'email': return 'البريد الإلكتروني غير صالح';
        case 'phone': return 'رقم الهاتف غير صالح';
        default: return 'التنسيق غير صحيح';
      }
    }
    if (errors['weakPassword']) return 'كلمة المرور يجب أن تحتوي على حرف كبير، حرف صغير، رقم و8 أحرف على الأقل';
    if (errors['mismatch']) return 'كلمات المرور غير متطابقة';
    if (errors['emailNotVerified']) return 'البريد الإلكتروني غير مفعل';
    if (errors['phoneTaken']) return 'رقم الهاتف مستخدم بالفعل';
    if (errors[`${fieldName}Whitespace`]) return 'لا يمكن أن يبدأ أو ينتهي بمسافات بيضاء';

    return '';
  }
}