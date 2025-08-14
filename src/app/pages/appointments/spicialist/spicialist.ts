import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentStateService } from '../../../services/appointment-state.service';
import { AvailabilityService } from '../../../services/availability.service';

@Component({
  selector: 'app-spicialist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './spicialist.html',
  styleUrls: ['./spicialist.scss']
})
export class Spicialist implements OnInit {
  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();

  specialists: any[] = [];
  selectedSpecialist: any = null;

  selectedSpecialistId: number | null = null;
  selectedDate: string = '';
  selectedTime: string = '';
  availableTimes: string[] = [];

  constructor(
    private stateService: AppointmentStateService,
    private availabilityService: AvailabilityService
  ) {}

  ngOnInit() {
    const centerId = this.stateService.getData().center_id;
    if (centerId) {
      this.loadSpecialists(centerId);
    } else {
      console.warn('❌ No center selected');
    }
  }

  loadSpecialists(centerId: number) {
    this.availabilityService.getCentersAvailability({})
      .subscribe({
        next: (res: any) => {
          console.log('✅ API Response:', res);
          if (res?.status === 'success') {
            const center = res.centers.find((c: any) => c.id === centerId);
            this.specialists = center?.specialists || [];
          }
        },
        error: (err) => {
          console.error('❌ Error fetching specialists:', err);
        }
      });
  }

  onSpecialistChange() {
    this.selectedSpecialist = this.specialists.find(s => s.id === this.selectedSpecialistId);
    this.availableTimes = [];
    this.selectedDate = '';
    this.selectedTime = '';
  }

 onDateChange() {
  if (!this.selectedSpecialist || !this.selectedDate) return;

  // جِب اسم اليوم بالعربي
  const dayName = new Date(this.selectedDate).toLocaleDateString('ar-EG', { weekday: 'long' });

  const isUnavailable = this.selectedSpecialist.unavailable?.days?.includes(this.selectedDate);

  if (isUnavailable || !this.selectedSpecialist.working_days.includes(dayName)) {
    this.availableTimes = [];
    return;
  }

  const workingHours = this.selectedSpecialist.working_hours.find((wh: any) => wh.day === dayName);
  if (workingHours) {
    this.availableTimes = this.generateTimeSlots(workingHours.start, workingHours.end);
  } else {
    this.availableTimes = [];
  }
}


  generateTimeSlots(start: string, end: string) {
    const times: string[] = [];
    let [h, m] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    while (h < endH || (h === endH && m < endM)) {
      times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      m += 30;
      if (m >= 60) { m = 0; h++; }
    }
    return times;
  }

goNext() {
  if (this.selectedSpecialistId && this.selectedDate && this.selectedTime) {
    const selectedSpecialist = this.specialists.find(s => s.id === this.selectedSpecialistId);

    if (selectedSpecialist) {
      this.stateService.setData({
        specialist_id: selectedSpecialist.id,
        specialist: {
          id: selectedSpecialist.id,
          name: selectedSpecialist.name,
          image: selectedSpecialist.image || ''
        },
        date: this.selectedDate,
        start: this.selectedTime
      });

      this.next.emit();
    }
  }
}

}
