import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppointmentStateService } from '../../../services/appointment-state.service';
import { AvailabilityService } from '../../../services/availability.service';
import { catchError, map, of } from 'rxjs';
import { forkJoin } from 'rxjs';
import { Center, Specialist } from '../../../../models/appointment.model';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-branch',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, TranslateModule],
  templateUrl: './branch.html',
  styleUrls: ['./branch.scss']
})
export class Branch implements OnInit {
  @Output() next = new EventEmitter<void>();

  sessionTypes: SessionType[] = [];
  selectedSessionKey?: string;


  centers: any[] = [];
  selectedBranchId: number | null = null;
  
 currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl'; 

  constructor(
    private stateService: AppointmentStateService,
    private availabilityService: AvailabilityService,
    private translate: TranslateService,  private languageService: LanguageService
  ) {}

  ngOnInit() {
    this.loadSessionTypes();

     // Set initial language
  this.currentLang = this.languageService.getCurrentLanguage();
  this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

  // Subscribe to language changes
  this.languageService.currentLang$.subscribe(lang => {
    this.currentLang = lang;
    this.dir = lang === 'ar' ? 'rtl' : 'ltr';
  });
  }

loadSessionTypes() {
  this.availabilityService.getSessionTypes().subscribe(res => {
    if (res?.status === 'success') {
      const allSessions: SessionType[] = res.data;

      const sessionObservables = allSessions.map(session => {
        const key = session.key.trim(); // إزالة المسافات أو newlines
        return this.availabilityService.getCentersAvailability(key).pipe(
          map(centerRes => {
            const centers: (Center & { specialists?: (Specialist & { working_days?: string[] })[] })[] = centerRes?.centers || [];
            
            const hasAvailableCenters = centers.some((center) => {
              const specialists = center.specialists || [];
              return specialists.some((sp) => (sp.working_days || []).length > 0);
            });

            return hasAvailableCenters ? session : null;
          }),
          catchError(() => of(null)) // لو حصل error نعتبره session غير متاح
        );
      });

      forkJoin(sessionObservables).subscribe(results => {
        // فلترة السيشنز اللي مالهاش أي فرع متاح
        this.sessionTypes = results.filter((s): s is SessionType => s !== null);
      });
    }
  });
}


loadCenters() {
  if (!this.selectedSessionKey) return;

  const sessionKey = this.selectedSessionKey.trim(); // remove extra spaces or newlines

  console.log('Selected session key:', sessionKey);

  this.availabilityService.getCentersAvailability(sessionKey).subscribe({
    next: (res: any) => {
      const centers: (Center & { specialists?: (Specialist & { working_days?: string[] })[] })[] = res?.centers || [];
      this.centers = centers;
      this.selectedBranchId = null;
      console.log('Centers response:', this.centers);
    },
    error: (err) => console.error('❌ Error fetching centers:', err)
  });
}




goNext() {
  if (!this.selectedBranchId || !this.selectedSessionKey) {
    console.warn('⚠️ Branch or session not selected');
    return;
  }

  const selectedCenter = this.centers.find(c => c.id === this.selectedBranchId);

  if (!selectedCenter) {
    console.warn('⚠️ Selected center not found');
    return;
  }

  // تجهيز البيانات للحفظ
  const dataToSave = {
    center_id: selectedCenter.id,
    center: {
      id: selectedCenter.id,
      name: selectedCenter.name,
      phone: selectedCenter.phone || '',
      address: selectedCenter.address || '',
      city: {
        id: selectedCenter.city?.id || null,
        name: selectedCenter.city?.name || '',
        name_ar: selectedCenter.city?.name_ar || ''
      }
    },
    session_type_key: this.selectedSessionKey // حفظ الجلسة
  };

  // حفظ البيانات في stateService
  this.stateService.setData(dataToSave);

  console.log('✅ Saved branch and session:', dataToSave);

  // الانتقال للخطوة التالية
  this.next.emit();
}

}
