import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AvailabilityService } from '../../../services/availability.service';
import { AppointmentStateService } from '../../../services/appointment-state.service';
import { Appointment } from '../../../../models/appointment.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';

declare var bootstrap: any; // لتفعيل الـ modal من Bootstrap

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './confirm.html',
  styleUrls: ['./confirm.scss']
})
export class Confirm {
  @Output() prev = new EventEmitter<void>();
  bookingData!: Partial<Appointment>;

  constructor(
    private stateService: AppointmentStateService,
    private appointmentService: AvailabilityService,
    private router: Router,
        private translate: TranslateService,  private languageService: LanguageService

  ) {
    this.bookingData = this.stateService.getData();
  }


  
 currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl'; 

 

  ngOnInit() {

     // Set initial language
  this.currentLang = this.languageService.getCurrentLanguage();
  this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

  // Subscribe to language changes
  this.languageService.currentLang$.subscribe(lang => {
    this.currentLang = lang;
    this.dir = lang === 'ar' ? 'rtl' : 'ltr';
  });
  }
 confirmBooking() {
  if (
    !this.bookingData.specialist?.id ||
    !this.bookingData.center?.id ||
    !this.bookingData.date ||
    !this.bookingData.start ||
    !this.bookingData.session_type_key
  ) {
    alert(
      this.translate.instant('الرجاء التأكد من اختيار الفرع، الأخصائي، نوع الجلسة والتاريخ/الوقت.')
    );
    return;
  }

  const payload = {
    specialist_id: this.bookingData.specialist.id,
    center_id: this.bookingData.center.id,
    date: this.bookingData.date,
    start: this.bookingData.start,
    appointment_type: this.bookingData.session_type_key,
    session_type: this.bookingData.session_type_key,
    payment_method: 'cash',
    is_paid: true
  };

 this.appointmentService.createAppointment(payload).subscribe({
  next: () => {
    this.stateService.reset();
    this.showSuccessPopup();
  },
  error: (err) => this.handleError(err)
});

}

errorMessage: string = '';



handleError(err: any) {
  console.error('API Error:', err);

  const errorCode = err.error?.code;
  let message = '';

  if (
    errorCode &&
    this.translate.instant(`errors.${errorCode}`) !== `errors.${errorCode}`
  ) {
    message = this.translate.instant(`errors.${errorCode}`);
  } else {
    message = this.translate.instant('errors.DEFAULT');
  }

  // خزّن الرسالة في المتغير (عشان تبان في المودال)
  this.errorMessage = message;

  // افتح الـ error modal
  const modalEl = document.getElementById('errorModal');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
}

  showSuccessPopup() {
    const modalEl = document.getElementById('successModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  goToReservations() {
    const modalEl = document.getElementById('successModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }
    this.router.navigate(['/profile/reservations']);
  }

  goHome() {
    const modalEl = document.getElementById('successModal');
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }
    this.router.navigate(['/']);
  }
}
