import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AddressData } from '../../../../../models/address.model';

@Component({
  selector: 'app-details-step',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './details-step.html',
  styleUrls: ['./details-step.scss']
})
export class DetailsStep implements OnChanges {
  @Input() initialData: Partial<AddressData> | null = null;
  @Output() submit = new EventEmitter<AddressData>();

  form: AddressData = {
    id: 0, // ✅ Default value for creation; will be overwritten on edit
    location_type: 'home',
    coordinate: '',
    government_name: '',
    city_name: '',
    area_name: '',
    street_name: '',
    building_number: '',
    apartment_number: '',
    floor_number: '',
    phone_number: '',
    comment: ''
  };

  // ✅ Detect input changes to populate form (for editing)
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData'] && this.initialData) {
      this.form = {
        ...this.form,
        ...this.initialData // override with initial values (including id if available)
      };
    }
  }

  submitForm(): void {
    if (!this.form.coordinate) {
      alert('اختر موقعًا على الخريطة أولًا');
      return;
    }

    if (
      !this.form.government_name ||
      !this.form.city_name ||
      !this.form.area_name ||
      !this.form.street_name ||
      !this.form.building_number ||
      !this.form.phone_number ||
      !this.form.location_type
    ) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const finalData: AddressData = {
      id: this.form.id,
      location_type: this.form.location_type,
      coordinate: this.form.coordinate,
      government_name: this.form.government_name,
      city_name: this.form.city_name,
      area_name: this.form.area_name,
      street_name: this.form.street_name,
      building_number: this.form.building_number,
      apartment_number: this.form.apartment_number || '',
      floor_number: this.form.floor_number || '',
      phone_number: this.form.phone_number,
      comment: this.form.comment || ''
    };

    console.log("📦 Sending to backend:", finalData);
    this.submit.emit(finalData);
  }
}
