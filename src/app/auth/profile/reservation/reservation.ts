import { Component, OnInit } from '@angular/core';
import { AvailabilityService } from '../../../services/availability.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-reservation',
    imports: [RouterModule],
  templateUrl: './reservation.html',
  styleUrls: ['./reservation.scss']
})
export class Reservation implements OnInit {
  appointments: any[] = [];
  loading = false;
  errorMessage = '';

  constructor(private availabilityService: AvailabilityService,  private router: Router  ) {}

  ngOnInit() {
    this.fetchAppointments();
  }

  fetchAppointments() {
    this.loading = true;
    console.log('📡 Fetching client appointments...');
    this.availabilityService.getClientAppointments().subscribe({
      next: (res) => {
        console.log('✅ Appointments response:', res);
        this.appointments = res.data;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error fetching appointments:', err);
        this.errorMessage = 'تعذر تحميل المواعيد';
        this.loading = false;
      }
    });
  }

  cancelAppointment(id: number) {
    if (!confirm('هل أنت متأكد من إلغاء هذا الموعد؟')) return;
    console.log(`📤 Sending cancel request for appointment ID: ${id}`);
    this.availabilityService.cancelAppointment(id).subscribe({
      next: (res) => {
        console.log('✅ Cancel response:', res);
        alert('تم إلغاء الموعد بنجاح');
        this.fetchAppointments();
      },
      error: (err) => {
        console.error('❌ Error cancelling appointment:', err);
        alert('تعذر إلغاء الموعد');
      }
    });
  }

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


    goToUpdateTime(id: number) {
    this.router.navigate(['/reservation', id]); // 👈 ينقلك للصفحة بالـ id
  }
}
