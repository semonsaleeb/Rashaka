import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class Register {
  registerForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      phone: ['', []], // optional
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirm = group.get('password_confirmation')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.registerForm.value;

    this.http.post<any>(`${environment.apiBaseUrl}/register`, formData, {
      headers: new HttpHeaders({
        'Accept': 'application/json'
      })
    }).subscribe({
      next: (response) => {
        this.successMessage = 'Registration successful!';
        console.log('Token:', response.token);
        console.log('Client:', response.client);
        
  setTimeout(() => {
    this.router.navigate(['/']);
  }, 1000);
        this.registerForm.reset();
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Registration failed.';
        this.loading = false;
      }
    });
  }

  showPassword = true;
showConfirmPassword = true;

togglePasswordVisibility() {
  this.showPassword = !this.showPassword;
}

toggleConfirmPasswordVisibility() {
  this.showConfirmPassword = !this.showConfirmPassword;
}
}
