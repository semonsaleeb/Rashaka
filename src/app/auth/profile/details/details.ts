import { Component, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ClientService } from '../../../services/client.service';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';
import { CommonModule } from '@angular/common';

declare var bootstrap: any;
@Component({
  selector: 'app-details',
  standalone: true,
  imports: [FormsModule, RouterModule, TranslateModule, CommonModule],
  templateUrl: './details.html',
  styleUrls: ['./details.scss']
})
export class Details implements OnInit {
 currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl'; // ← default direction



  client: any = {
    email: '',
    phone: '',
    name: ''
  };

  constructor(private translate: TranslateService, private languageService: LanguageService,private clientService: ClientService,private auth: AuthService, private router: Router,) {}

ngOnInit(): void {
  // Load client profile
  this.clientService.getProfile().subscribe({
    next: (res) => {
      if (res.client) {
        // Response from GET profile API
        this.client = res.client;
      } else if (res.data) {
        // Response from UPDATE profile API
        this.client = res.data;
      } else {
        this.client = { name: '', email: '', phone: '' };
      }
      console.log('Loaded client:', this.client);
    },
    error: (err) => console.error('Error loading client profile:', err)
  });

  // Set initial language and direction
  this.currentLang = this.languageService.getCurrentLanguage();
  this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

  // Subscribe to language changes
  this.languageService.currentLang$.subscribe(lang => {
    this.currentLang = lang;
    this.dir = lang === 'ar' ? 'rtl' : 'ltr';
  });
}

updateProfile() {
  this.clientService.updateProfile({
    name: this.client.name,
    email: this.client.email,
    phone: this.client.phone
  }).subscribe({
    next: (res) => {
      // Reset editing flags
      this.isEditingName = false;
      this.isEditingEmail = false;
      this.isEditingPhone = false;

      // Show Bootstrap modal after successful update
      const modalEl = document.getElementById('profileUpdatedModal');
      if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
      }

      // Update local client data from API response
      if (res.data) this.client = res.data;
    },
    error: (err) => console.error('Error updating profile:', err)
  });
}

logout() {
  this.auth.logout().subscribe({
    next: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('client');
      this.router.navigate(['/auth']).then(() => {
        window.location.reload(); // ✅ Full page refresh after navigating
      });
    },
    error: (err) => {
      console.error('Logout failed', err);
      localStorage.removeItem('token');
      localStorage.removeItem('client');
      this.router.navigate(['/auth']).then(() => {
        window.location.reload(); // ✅ Also refresh on error fallback
      });
    }
  });
}


  DeleteAccount(): void {
    // ✅ Step 1: Confirm
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (!confirmed) return;

    // ✅ Step 2: Call API
    this.clientService.deleteAccount().subscribe({
      next: (res) => {
        console.log('Account deleted:', res);

        // ✅ Step 3: Clear local data
        localStorage.removeItem('token');
        localStorage.removeItem('client'); // if you store client info
        sessionStorage.clear();

        // ✅ Step 4: Redirect
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        console.error('Error deleting account:', err);
        alert('Failed to delete account. Please try again.');
      }
    });
  }

confirmDeleteAccount(): void {
  this.clientService.deleteAccount().subscribe({
    next: (res) => {
      console.log('Account deleted:', res);

      // 🧹 امسح البيانات وحدث حالة تسجيل الدخول
      this.auth.clearAuth(); 
      sessionStorage.clear();

      // 🔹 اغلق أي مودال مفتوح حالياً
      const modals = document.querySelectorAll('.modal.show');
      modals.forEach(modalEl => {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) {
          modalInstance.hide();
        }
      });

      // ✅ افتح مودال النجاح
      const modalElement = document.getElementById('deleteSuccessModal');
      if (modalElement) {
        const modal = new bootstrap.Modal(modalElement, {
          backdrop: 'static', // يمنع الإغلاق بالنقر على الخلفية
          keyboard: true      // يتيح الإغلاق بزر Back أو Esc
        });
        modal.show();

        // ⬅️ أضف حدث Back لإغلاق المودال عند الضغط على زر الرجوع في الهاتف
        const handlePopState = () => {
          modal.hide();
          window.removeEventListener('popstate', handlePopState);
        };
        window.addEventListener('popstate', handlePopState);
      }
    },
    error: (err) => {
      console.error('Error deleting account:', err);
      alert('Error deleting account');
    }
  });
}


  loadClientProfile() {
    this.clientService.getProfile().subscribe({
      next: (res) => this.client = res.data,
      error: (err) => console.error(err),
    });
  }


 

  goHome() {
    this.router.navigate(['/']);
  }

isEditing: boolean = false;

isEditingName: boolean = false;
  isEditingEmail: boolean = false;
  isEditingPhone: boolean = false;
enableEditing(field: string) {
    if (field === 'name') this.isEditingName = true;
    if (field === 'email') this.isEditingEmail = true;
    if (field === 'phone') this.isEditingPhone = true;
  }

  disableEditing(field: string) {
    if (field === 'name') this.isEditingName = false;
    if (field === 'email') this.isEditingEmail = false;
    if (field === 'phone') this.isEditingPhone = false;
  }

}
