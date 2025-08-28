import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentStateService } from '../../../services/appointment-state.service';
import { AvailabilityService } from '../../../services/availability.service';

@Component({
  selector: 'app-branch',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './branch.html',
  styleUrls: ['./branch.scss']
})
export class Branch implements OnInit {
  @Output() next = new EventEmitter<void>();

  centers: any[] = [];
  selectedBranchId: number | null = null;

  constructor(
    private stateService: AppointmentStateService,
    private availabilityService: AvailabilityService
  ) {}

  ngOnInit() {
    this.loadCenters();
  }

 loadCenters() {
  this.availabilityService.getCentersAvailability({})
    .subscribe({
      next: (res: any) => {
        if (res?.status === 'success') {
          // فلترة المراكز اللي عندها أخصائيين متاحين فقط
       this.centers = (res.centers || []).filter((center: any) => {
  const specialists = center.specialists || [];
  return specialists.some((sp: any) => {
    const workingDays = sp.working_days || [];
    return workingDays.length > 0; // أي أخصائي عنده مواعيد
  });
});

        }
      },
      error: (err) => {
        console.error('❌ Error fetching centers:', err);
      }
    });
}


goNext() {
  if (this.selectedBranchId) {
    // نفترض ان عندك centers جايالك من API
    const selectedCenter = this.centers.find(c => c.id === this.selectedBranchId);

    if (selectedCenter) {
      this.stateService.setData({
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
        }
      });
      this.next.emit();
    }
  }
}

}
