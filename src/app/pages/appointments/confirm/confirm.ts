import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AvailabilityService } from '../../../services/availability.service';
import { AppointmentStateService } from '../../../services/appointment-state.service';
import { Appointment } from '../../../../models/appointment.model';

declare var bootstrap: any; // لتفعيل الـ modal من Bootstrap

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm.html',
  styleUrls: ['./confirm.scss']
})
export class Confirm {
  @Output() prev = new EventEmitter<void>();
  bookingData!: Partial<Appointment>;

  constructor(
    private stateService: AppointmentStateService,
    private appointmentService: AvailabilityService,
    private router: Router
  ) {
    this.bookingData = this.stateService.getData();
  }

  confirmBooking() {
   const payload = {
  specialist_id: this.bookingData.specialist?.id,
  date: this.bookingData.date!,
  start: this.bookingData.start!,
  appointment_type: 'consultation',
  session_type: this.bookingData.session_type_key || null,
  payment_method: 'cash',
  is_paid: true
};

    this.appointmentService.createAppointment(payload).subscribe({
      next: () => {
        this.stateService.reset();
        this.showSuccessPopup();
      },
      error: (err) => {
        console.error('API Error:', err);
        alert('حدث خطأ أثناء تأكيد الحجز');
      }
    });
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
