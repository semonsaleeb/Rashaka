import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AddressData } from '../../../../../models/address.model';

@Component({
  selector: 'app-details-step',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './details-step.html',
  styleUrls: ['./details-step.scss']
})
export class DetailsStep implements OnChanges  {
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
    comment: '',
    name: ''
  };
@Input() clientPhone: string = '';
 @Input() clientName!: string;
 


  // ✅ Detect input changes to populate form (for editing)
ngOnChanges(changes: SimpleChanges): void {

  if (changes['initialData'] && this.initialData) {
    this.form = {
      ...this.form,
      ...this.initialData
    };
  }

  // Fill phone_number from client if empty
  if (!this.form.phone_number && this.clientPhone) {
    this.form.phone_number = this.clientPhone;
  }
    // Fill name from phone if empty
   if (!this.form.name && this.clientName) {
    
      this.form.name = this.clientName;
    }
}



submitForm(): void {
  
  if (!this.form.coordinate) {
    alert('اختر موقعًا على الخريطة أولًا');
    return;
  }

  // ✅ استخدم رقم الهاتف من الـ @Input إذا لم يكن موجودًا
  if (!this.form.phone_number && this.clientPhone) {
    this.form.phone_number = this.clientPhone;
  }

  const missingFields: string[] = [];
  if (!this.form.government_name) missingFields.push('المحافظة');
  if (!this.form.city_name) missingFields.push('المدينة');
  if (!this.form.area_name) missingFields.push('الحي');
  if (!this.form.street_name) missingFields.push('اسم الشارع');
  if (!this.form.building_number) missingFields.push('رقم المبنى');
  if (!this.form.phone_number) missingFields.push('رقم الهاتف');

  if (missingFields.length > 0) {
    alert(`يرجى ملء الحقول التالية:\n- ${missingFields.join('\n- ')}`);
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

  // console.log("📦 Sending to backend:", finalData);
  this.submit.emit(finalData);
}

}
