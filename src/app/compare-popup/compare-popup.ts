import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../services/language.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-compare-popup',
  standalone: true,
  imports: [HttpClientModule, TranslateModule, CommonModule],
  templateUrl: './compare-popup.html',
  styleUrls: ['./compare-popup.scss']
})
export class ComparePopup implements OnInit {
  @Input() products: any[] = [];
  @Output() close = new EventEmitter<void>();
  comparedData: any[] = [];
 currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl';

  constructor(private http: HttpClient,     private translate: TranslateService,
      private languageService: LanguageService) {}

  ngOnInit(): void {
    const names = this.products.map(p => p.name).join(',');
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    });

    this.http.get(`${environment.apiBaseUrl}/products/search-multiple?q=${names}`, { headers })
      .subscribe((res: any) => {
        this.comparedData = res.data;
      });

          // إعداد اللغة
    this.currentLang = this.languageService.getCurrentLanguage();
    this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

    this.languageService.currentLang$.subscribe((lang) => {
      this.currentLang = lang;
      this.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });
  
  }

  closePopup() {
    this.close.emit();
  }
}
