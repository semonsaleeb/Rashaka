import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ClientService } from '../../services/client.service';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbDropdownModule, TranslateModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile implements OnInit {
  client: any = null;
  selectedFile: File | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl'; // ← default direction

  constructor(private translate: TranslateService, private languageService: LanguageService,private http: HttpClient, private clientService: ClientService) {}



  

  ngOnInit(): void {
    this.loadProfile();

        // Set initial language
    this.currentLang = this.languageService.getCurrentLanguage();
    this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

    // Subscribe to language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });
  }

loadProfile(): void {
  this.clientService.getProfile().subscribe({
    next: (res) => {
      console.log("🔹 Full API Response:", res);

      this.client = res.client; // 👈 خد الـ client بس

      if (this.client?.image) {
        this.checkImage(this.client.image).then((isValid) => {
          if (!isValid) {
            console.warn("⚠️ صورة غير صالحة، هنعرض صورة افتراضية");
            this.client.image = 'assets/Images/default-user.png'; 
          }
        });
      }
    },
    error: (err) => {
      console.error('❌ فشل جلب البيانات:', err);
      this.errorMessage = 'حدث خطأ أثناء تحميل البيانات.';
    }
  });
}


/**
 * ✅ يتأكد إن الصورة صالحة (status 200)
 */
checkImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}



  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        this.errorMessage = 'نوع الملف غير مدعوم. يرجى اختيار صورة بصيغة JPEG, PNG, أو WebP.';
        return;
      }
      
      if (file.size > maxSize) {
        this.errorMessage = 'حجم الملف كبير جداً. الحد الأقصى هو 5MB.';
        return;
      }
      
      this.selectedFile = file;
      this.errorMessage = '';
      this.uploadImage();
    }
  }

  uploadImage(): void {
    if (!this.selectedFile) return;
    
    this.isLoading = true;
    this.clientService.uploadProfileImage(this.selectedFile).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'تم تحديث صورة الملف الشخصي بنجاح';
        this.client.image = response.data.image_url; // Update the image URL
        this.selectedFile = null;
        
        // Update the client in localStorage if needed
        const storedClient = JSON.parse(localStorage.getItem('client') || '{}');
        storedClient.image = response.data.image_url;
        localStorage.setItem('client', JSON.stringify(storedClient));
        
        // Clear messages after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error uploading image:', error);
        this.errorMessage = error.error?.message || 'فشل في رفع الصورة';
      }
    });
  }

  deleteImage(): void {
    if (!confirm('هل أنت متأكد من حذف صورة الملف الشخصي؟')) return;
    
    this.isLoading = true;
    this.clientService.deleteProfileImage().subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'تم حذف صورة الملف الشخصي بنجاح';
        this.client.image = null;
        
        // Update the client in localStorage if needed
        const storedClient = JSON.parse(localStorage.getItem('client') || '{}');
        storedClient.image = null;
        localStorage.setItem('client', JSON.stringify(storedClient));
        
        // Clear messages after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error deleting image:', error);
        this.errorMessage = error.error?.message || 'فشل في حذف الصورة';
      }
    });
  }
}