// src/app/services/language.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLangSubject = new BehaviorSubject<string>('ar');
  public currentLang$ = this.currentLangSubject.asObservable();

  constructor() {
    // محاولة استعادة اللغة من localStorage إن وجدت
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang) {
      this.setLanguage(savedLang);
    } else {
      this.setLanguage('ar');
    }
  }

  setLanguage(lang: string) {
    this.currentLangSubject.next(lang);
    
    // تعيين اتجاه النص
    const direction = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = direction;
    document.documentElement.lang = lang;
    
    // حفظ التفضيل
    localStorage.setItem('preferredLanguage', lang);
  }

  getCurrentLanguage(): string {
    return this.currentLangSubject.value;
  }
}