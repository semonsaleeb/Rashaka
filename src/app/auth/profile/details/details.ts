import { Component, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ClientService } from '../../../services/client.service';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [FormsModule, RouterModule, TranslateModule],
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
  this.clientService.getProfile().subscribe({
    next: (res) => {
      this.client = res.client;
      console.log('Client:', this.client);
    },
    error: (err) => {
      console.error('Error loading client profile:', err); // Shows full error
    }
  });

       // Set initial language
    this.currentLang = this.languageService.getCurrentLanguage();
    this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

    // Subscribe to language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.dir = lang === 'ar' ? 'rtl' : 'ltr';
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
}
