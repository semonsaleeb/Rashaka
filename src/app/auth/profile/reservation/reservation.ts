import { Component, OnInit } from '@angular/core';
import { AvailabilityService } from '../../../services/availability.service';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';

declare var bootstrap: any; // 👈 مهم عشان يشتغل الـ Modal

@Component({
  selector: 'app-reservation',
  standalone: true,
  imports: [RouterModule, TranslateModule],
  templateUrl: './reservation.html',
  styleUrls: ['./reservation.scss']
})
export class Reservation implements OnInit {
  appointments: any[] = [];
  loading = false;
  errorMessage = '';

  // 👇 المتغير اللي كان عامللك Error
  appointmentToCancel: number | null = null;

  currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl'; // ← default direction


  constructor(
    private availabilityService: AvailabilityService,
    private router: Router,
    private translate: TranslateService, private languageService: LanguageService,
  ) {}

  ngOnInit() {
    this.fetchAppointments();
            // Set initial language
    this.currentLang = this.languageService.getCurrentLanguage();
    this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

    // Subscribe to language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });
  }
  

  // 📌 تجيب كل المواعيد
fetchAppointments() {
  this.loading = true;
  console.log('📡 Fetching upcoming client appointments...');

  this.availabilityService.getUpcomingAppointments().subscribe({
    next: (res) => {
      console.log('✅ Upcoming Appointments response:', res);
      this.appointments = res.data;
      this.loading = false;
    },
    error: (err) => {
      console.error('❌ Error fetching upcoming appointments:', err);
      this.errorMessage = 'تعذر تحميل المواعيد';
      this.loading = false;
    }
  });
}


  // 📌 فتح المودال عشان يطلب تأكيد الإلغاء
  cancelAppointment(id: number) {
    this.appointmentToCancel = id;

    const modalEl = document.getElementById('cancelModal');
    if (modalEl) {
      const myModal = new bootstrap.Modal(modalEl, {
        backdrop: 'static',
        keyboard: false
      });
      myModal.show();
    }
  }

  // 📌 تنفيذ الإلغاء بعد التأكيد
  confirmCancel() {
    if (!this.appointmentToCancel) return;

    this.availabilityService.cancelAppointment(this.appointmentToCancel).subscribe({
      next: (res) => {
        console.log('✅ Cancel response:', res);
        this.fetchAppointments();
      },
      error: (err) => {
        console.error('❌ Error cancelling appointment:', err);
        alert('تعذر إلغاء الموعد');
      }
    });

    // اغلاق المودال بعد التأكيد
    const modalEl = document.getElementById('cancelModal');
    if (modalEl) {
      const myModal = bootstrap.Modal.getInstance(modalEl);
      if (myModal) myModal.hide();
    }

    this.appointmentToCancel = null;
  }

  // 📌 تعديل وقت الموعد (باستخدام prompt حالياً)
  updateAppointmentTime(id: number) {
    const newDate = prompt('أدخل التاريخ الجديد (YYYY-MM-DD):');
    const newStart = prompt('أدخل وقت البدء الجديد (HH:MM):');
    if (!newDate || !newStart) return;

    console.log(`📤 Sending updateTime request for appointment ID: ${id}`, {
      date: newDate,
      start: newStart
    });

    this.availabilityService.updateAppointmentTime(id, newDate, newStart).subscribe({
      next: (res) => {
        console.log('✅ Update time response:', res);
        alert('تم تعديل وقت الموعد بنجاح');
        this.fetchAppointments();
      },
      error: (err) => {
        console.error('❌ Error updating appointment time:', err);
        alert('تعذر تعديل وقت الموعد');
      }
    });
  }

  // 📌 الانتقال لصفحة تعديل الموعد مع تمرير الـ id
  goToUpdateTime(id: number) {
    this.router.navigate(['/reservation', id]);
  }
}
