import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentStateService } from '../../../services/appointment-state.service';
import { AvailabilityService } from '../../../services/availability.service';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-spicialist',
  standalone: true,
  imports: [CommonModule, FormsModule,    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule, TranslateModule],
  templateUrl: './spicialist.html',
  styleUrls: ['./spicialist.scss']
})
export class Spicialist implements OnInit {
  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();
today: Date = new Date();


selectedSpecialist: any = null;
selectedSpecialistId: number | null = null;
selectedDate: string = '';
selectedTime: string = '';
availableTimes: { start: string, end: string }[] = [];
specialists: any[] = []; // افترض إنها موجودة
dateRange = { from: new Date(), to: new Date(new Date().setDate(new Date().getDate() + 30)) };
  currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl'; 
  constructor(
    private stateService: AppointmentStateService,
    private availabilityService: AvailabilityService,
    private translate: TranslateService,  private languageService: LanguageService
  ) {}

  ngOnInit() {
    const centerId = this.stateService.getData().center_id;
    if (centerId) {
      this.loadSpecialists(centerId);
    } else {
      console.warn('❌ No center selected');
    }
      this.currentLang = this.languageService.getCurrentLanguage();
  this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

  // Subscribe to language changes
  this.languageService.currentLang$.subscribe(lang => {
    this.currentLang = lang;
    this.dir = lang === 'ar' ? 'rtl' : 'ltr';
  });
  }


loadSpecialists(centerId: number) {
  const sessionKey = this.stateService.getData()?.session_type_key;

  if (!sessionKey) {
    console.warn('⚠️ No session key selected');
    return;
  }

  this.availabilityService.getCentersAvailability(sessionKey)
    .subscribe({
      next: (res: any) => {
        console.log('✅ API Response:', res);

        if (res?.status === 'success') {
          this.dateRange = res.range;
          this.extractMonthsFromRange();

          const center = res.centers.find((c: any) => c.id === centerId);

          this.specialists = (center?.specialists || []).filter((sp: any) => {
            const availableDates = this.getAvailableDatesForSpecialist(sp);
            return availableDates.length > 0;
          });

          console.log("📌 Specialists with availability:", this.specialists);
        }
      },
      error: (err) => {
        console.error('❌ Error fetching specialists:', err);
      }
    });
}




dateFilter = (date: Date | null): boolean => {
  if (!date || !this.selectedSpecialist) return false;

  const dateStr = date.toISOString().split('T')[0];
  return this.isDateAvailable(dateStr); // الأيام المتاحة ترجع true
}



weeksArray(days: string[]): (string | null)[][] {
  const weeks: (string | null)[][] = [];
  let week: (string | null)[] = new Array(7).fill(null);

  days.forEach(dateStr => {
    const dateObj = new Date(dateStr);
    const dayOfWeek = dateObj.getDay(); // 0 = الأحد ... 6 = السبت

    week[dayOfWeek] = dateStr;

    if (dayOfWeek === 6) {
      weeks.push(week);
      week = new Array(7).fill(null);
    }
  });

  if (week.some(d => d !== null)) {
    weeks.push(week);
  }

  return weeks;
}

currentDate = new Date(); 
months = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];
getTodayName(): string {
  const days = [
    'الأحد',
    'الاثنين',
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
    'الجمعة',
    'السبت'
  ];
  return days[this.today.getDay()];
}

get currentMonthName(): string {
  return this.months[this.currentDate.getMonth()];
}

get currentYear(): number {
  return this.currentDate.getFullYear();
}

goToPreviousMonth() {
  this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
}

goToNextMonth() {
  this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
}


// ==============================


// عند تغيير الاختيار
// ==============================



availableMonths: { name: string, index: number }[] = [];

// استخراج الشهور من التواريخ المتاحة
extractAvailableMonths(dates: string[]) {
  const monthsSet = new Set<number>();

  dates.forEach(dateStr => {
    const d = new Date(dateStr);
    monthsSet.add(d.getMonth()); // index من 0 - 11
  });

  this.availableMonths = Array.from(monthsSet).map(m => ({
    index: m,
    name: this.months[m]
  }));
}

onSpecialistChange() {
  this.selectedSpecialist = this.specialists.find(s => s.id === this.selectedSpecialistId);
  this.availableTimes = [];
  this.selectedDate = '';
  this.selectedTime = '';

  if (this.selectedSpecialist) {
    const availableDates = this.getAvailableDatesForSpecialist(this.selectedSpecialist);
    console.log("✅ Available dates:", availableDates);

    // هنا نستخرج الشهور المتاحة
    this.extractAvailableMonths(availableDates);
  }
  
}
get isCurrentMonthAvailable(): boolean {
  return this.availableMonths.some(m => m.index === this.currentDate.getMonth());
}


// onSpecialistChange() {
//   this.selectedSpecialist = this.specialists.find(s => s.id === this.selectedSpecialistId);
//   this.availableTimes = [];
//   this.selectedDate = '';
//   this.selectedTime = '';

//   if (this.selectedSpecialist) {
//     const availableDates = this.getAvailableDatesForSpecialist(this.selectedSpecialist);
//     console.log("✅ Available dates:", availableDates);
//   }
// }

// ==============================
// جلب الأيام المتاحة
// ==============================
getAvailableDatesForSpecialist(specialist: any): string[] {
  const availableDates: string[] = [];
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + 30); // 30 يوم قدام

  for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayName = d.toLocaleDateString('ar-EG', { weekday: 'long' });
    if (specialist.working_days.includes(dayName)) {
      availableDates.push(new Date(d).toISOString().split('T')[0]); // YYYY-MM-DD
    }
  }

  return availableDates;
}

// ==============================
// تحويل الرينج لأيام
// ==============================
dateRangeArray(): string[] {
  const dates: string[] = [];
  let current = new Date(this.dateRange.from);
  const end = new Date(this.dateRange.to);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// ==============================
// التحقق من توفر اليوم
// ==============================
// component.ts
isDateAvailable(date: string): boolean {
  if (!this.selectedSpecialist) return false;

  const availableDates = this.getAvailableDatesForSpecialist(this.selectedSpecialist);

  // رجع تاريخ النهاردة بدون وقت
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // اليوم اللي جاي من الكاليندر
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  // لو اليوم أقدم من النهاردة → مش متاح
  if (day < today) return false;

  // format التاريخ علشان يبقى زي اللي في availableDates
  const formattedDay = this.formatDate(day);

  return availableDates.includes(formattedDay);
}

private formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // مثال: "2025-08-28"
}



availableMonthsRange: { month: number, year: number, name: string, days: string[] }[] = [];
selectedMonthIndex: number = 0;

extractMonthsFromRange() {
  const monthsMap = new Map<string, string[]>(); // key = year-month, value = days[]

  let current = new Date(this.dateRange.from);
  const end = new Date(this.dateRange.to);

  while (current <= end) {
    const key = `${current.getFullYear()}-${current.getMonth()}`;
    const dateStr = current.toISOString().split('T')[0];

    if (!monthsMap.has(key)) {
      monthsMap.set(key, []);
    }
    monthsMap.get(key)!.push(dateStr);

    current.setDate(current.getDate() + 1);
  }

  // حطهم في array مرتب بدون شيل أي أيام
  this.availableMonthsRange = Array.from(monthsMap.entries())
    .map(([key, days]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        month,
        year,
        name: this.months[month] + ' ' + year,
        days
      };
    });

  console.log('📅 availableMonthsRange:', this.availableMonthsRange);
}


prevMonth() {
  if (this.selectedMonthIndex > 0) {
    this.selectedMonthIndex--;
  }
}

nextMonth() {
  if (this.selectedMonthIndex < this.availableMonthsRange.length - 1) {
    this.selectedMonthIndex++;
  }
}




// ==============================
// اختيار اليوم
// ==============================
selectDate(date: string) {
  if (this.isDateAvailable(date)) {
    this.selectedDate = date;
    this.onDateChange();
  }
}





// ==============================
// عند تغيير التاريخ
// ==============================
onDateChange() {
  if (!this.selectedSpecialist || !this.selectedDate) return;

  const dayName = new Date(this.selectedDate).toLocaleDateString('ar-EG', { weekday: 'long' });

  if (!this.selectedSpecialist.working_days.includes(dayName)) {
    this.availableTimes = [];
    return;
  }

  const workingHours = this.selectedSpecialist.working_hours.find((wh: any) => wh.day === dayName);

  if (!workingHours || !workingHours.start || !workingHours.end) {
    this.availableTimes = [];
    return;
  }

  this.availableTimes = this.generateTimeSlots(workingHours.start, workingHours.end);
}



// ==============================
// دالة توليد الأوقات
// ==============================
generateTimeSlots(start: string, end: string): { start: string, end: string }[] {
  const slots: { start: string, end: string }[] = [];
  let [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);

  while (startHour < endHour || (startHour === endHour && startMin < endMin)) {
    const slotStart = `${startHour.toString().padStart(2,'0')}:${startMin.toString().padStart(2,'0')}`;

    startMin += 30; // نص ساعة
    if (startMin >= 60) {
      startMin = 0;
      startHour++;
    }

    const slotEnd = `${startHour.toString().padStart(2,'0')}:${startMin.toString().padStart(2,'0')}`;

    slots.push({ start: slotStart, end: slotEnd });
  }

  return slots;
}



goNext() {
  // الشرط الأساسي: لازم كل القيم تكون موجودة
  if (!this.selectedSpecialistId || !this.selectedDate || !this.selectedTime) {
    return;
  }

  const selectedSpecialist = this.specialists.find(
    s => s.id === this.selectedSpecialistId
  );

  if (!selectedSpecialist) {
    return;
  }

  // تجهيز الداتا
  const data = {
    specialist_id: selectedSpecialist.id,
    specialist: {
      id: selectedSpecialist.id,
      name: selectedSpecialist.name,
      image: selectedSpecialist.image ?? '' // fallback فاضي لو مفيش صورة
    },
    date: this.selectedDate,
    start: this.selectedTime
  };

  // حفظ الداتا في service
  this.stateService.setData(data);

  // الانتقال للخطوة التالية
  this.next.emit();
}


}
