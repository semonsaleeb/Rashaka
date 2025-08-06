import { Component, OnInit } from '@angular/core';
import { AddressService } from '../../../services/address.service';
import { ClientService } from '../../../services/client.service';
import { AddressData } from '../../../../models/address.model';
import { CommonModule } from '@angular/common';
import { DetailsStep } from './details-step/details-step';
import { MapStep } from './map-step/map-step';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-address',
  standalone: true,
  imports: [CommonModule, DetailsStep, MapStep, FormsModule],
  templateUrl: './address.html',
  styleUrl: './address.scss'
})
export class Address implements OnInit {
  showSteps = false;
  step = 1;
  addressData!: AddressData;
  addressList: AddressData[] = [];
  client: any = {
    email: '',
    phone: '',
    name: ''
  };
  isEditing = false;


  constructor(
    private addressService: AddressService,
    private clientService: ClientService // ✅ Inject ClientService
  ) { }

  ngOnInit(): void {
    this.fetchAddresses();
    this.loadClientProfile(); // ✅ Use service instead of decodeToken
  }

 loadClientProfile() {
  this.clientService.getProfile().subscribe({
    next: (res) => {
      this.client = res.client;
      console.log('✅ Client loaded:', this.client);
    },
    error: (err) => {
      console.error('❌ Failed to load client profile:', err);
    }
  });
}


  getFullAddress(address: any): string {
    return `${address.street_name}, ${address.area_name}, ${address.city_name}, ${address.government_name}, عمارة ${address.building_number}, شقة ${address.apartment_number}, الدور ${address.floor_number}`;
  }

  fetchAddresses() {
    this.addressService.getAllAddresses().subscribe({
      next: (res) => {
        this.addressList = res.data;
      },
      error: () => {
        alert('فشل تحميل العناوين');
      }
    });
  }

  startAddressFlow() {
    this.showSteps = true;
    this.step = 1;
  }

goToDetails(dataFromMap: Partial<AddressData>) {
  this.step = 2;

  if (this.addressData?.id) {
    this.addressData = {
      ...this.addressData,
      ...dataFromMap
    };
  } else {
    this.addressData = {
      ...dataFromMap
    } as AddressData;
  }

  // 🔁 Force Angular to detect new input bindings
  this.addressData = { ...this.addressData };
  this.client = { ...this.client };
}




  submitAddress(finalData: AddressData) {
    if (this.isEditing) {
      // تعديل العنوان
      const payload = {
        address_id: finalData.id,
        government_name: finalData.government_name,
        city_name: finalData.city_name,
        area_name: finalData.area_name,
        street_name: finalData.street_name,
        building_number: finalData.building_number,
        apartment_number: finalData.apartment_number,
        floor_number: finalData.floor_number,
        phone_number: this.client.phone,
        comment: finalData.comment,
        location_type: finalData.location_type,
        coordinate: finalData.coordinate
      };

      this.addressService.editAddress(payload).subscribe({
        next: (res) => {
          alert('تم تعديل العنوان بنجاح');
          this.fetchAddresses();
          this.showSteps = false;
          this.step = 1;
          this.isEditing = false;
        },
        error: (err) => {
          console.error('خطأ في تعديل العنوان', err);
          alert('فشل تعديل العنوان');
        }
      });
    } else {
      // إضافة جديد
      this.addressService.addAddress(finalData).subscribe({
        next: (res) => {
          alert('تم إضافة العنوان بنجاح');
          this.fetchAddresses();
          this.showSteps = false;
          this.step = 1;
        },
        error: (err) => {
          if (err.status === 401) {
            alert('يجب تسجيل الدخول قبل إضافة العنوان');
          } else {
            alert('حدث خطأ أثناء إرسال العنوان');
          }
        }
      });
    }
  }

editAddress(address: AddressData) {
  console.log('📦 Editing address:', address);

  this.isEditing = true;
  this.showSteps = true;
  this.step = 1; // ⬅️ يعرض الخريطة أولًا

  // نحفظ بيانات العنوان في المتغير مؤقتًا (لكن لا نمررها الآن للفورم)
  this.addressData = {
    id: address.id,
    location_type: address.location_type || 'home',
    coordinate: address.coordinate || '',
    government_name: address.government_name || '',
    city_name: address.city_name || '',
    area_name: address.area_name || '',
    street_name: address.street_name || '',
    building_number: address.building_number || '',
    apartment_number: address.apartment_number || '',
    floor_number: address.floor_number || '',
    phone_number: address.phone_number || '',
    comment: address.comment || ''
  };
}



}
