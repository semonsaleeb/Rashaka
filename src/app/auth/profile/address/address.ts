import { Component, OnInit } from '@angular/core';
import { AddressService } from '../../../services/address.service';
import { ClientService } from '../../../services/client.service';
import { AddressData } from '../../../../models/address.model';

import { DetailsStep } from './details-step/details-step';
import { MapStep } from './map-step/map-step';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';
declare var bootstrap: any;

@Component({
  selector: 'app-address',
  standalone: true,
  imports: [DetailsStep, MapStep, FormsModule, TranslateModule],
  templateUrl: './address.html',
  styleUrl: './address.scss'
})
export class Address implements OnInit {
  showSteps = false;
  step = 1;
  errorDeleteMessage: string = '';

  addressData!: AddressData;
  addressList: AddressData[] = [];
  client: any = {
    email: '',
    phone: '',
    name: ''
  };
  isEditing = false;
  pendingDeleteId: number | null = null; // لتخزين العنوان المراد حذفه

  currentLang: string = 'ar';
  dir: 'ltr' | 'rtl' = 'rtl'; // ← default direction

  constructor(
    private addressService: AddressService,
    private clientService: ClientService,
    private translate: TranslateService, private languageService: LanguageService,
  ) { }

  ngOnInit(): void {
    this.fetchAddresses();
    this.loadClientProfile();
    this.currentLang = this.languageService.getCurrentLanguage();
    this.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';

    // Subscribe to language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });
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
    const parts = [
      address.street_name,
      address.area_name,
      address.city_name,
      address.government_name,
      address.building_number ? 'عمارة ' + address.building_number : '',
      address.apartment_number ? 'شقة ' + address.apartment_number : '',
      address.floor_number ? 'الدور ' + address.floor_number : ''
    ];
    return parts.filter(part => part && part.trim() !== '').join(', ');
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
      this.addressData = { ...this.addressData, ...dataFromMap };
    } else {
      this.addressData = { ...dataFromMap } as AddressData;
    }
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
        next: () => {
          this.fetchAddresses();
          this.showSteps = false;
          this.step = 1;
          this.isEditing = false;
          this.openAddSuccessModal(); // استخدام مودال النجاح
        },
        error: (err) => {
          console.error('خطأ في تعديل العنوان', err);
        }
      });
    } else {
      // إضافة جديد
      this.addressService.addAddress(finalData).subscribe({
        next: () => {
          this.fetchAddresses();
          this.showSteps = false;
          this.step = 1;
          this.openAddSuccessModal();
        },
        error: (err) => {
          if (err.status === 401) {
            alert('يجب تسجيل الدخول قبل إضافة العنوان');
          }
        }
      });
    }
  }

  editAddress(address: AddressData) {
    console.log('📦 Editing address:', address);
    this.isEditing = true;
    this.showSteps = true;
    this.step = 1; // عرض الخريطة أولاً
    this.addressData = { ...address };
  }

  deleteAddress(addressId: number) {
    this.openDeleteConfirmModal(addressId);
  }

  // ------------------ MODALS ------------------

  // فتح مودال إضافة/تعديل بنجاح
  openAddSuccessModal() {
    const modalEl = document.getElementById('successAddModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  // فتح مودال حذف بنجاح
  openDeleteSuccessModal() {
    const modalEl = document.getElementById('successDeleteModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  // فتح مودال تأكيد الحذف
  openDeleteConfirmModal(addressId: number) {
    this.pendingDeleteId = addressId;
    const modalEl = document.getElementById('deleteConfirmModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }

  // عند الضغط على حذف داخل Confirm Delete Modal
confirmDelete() {
  if (!this.pendingDeleteId) return;

  const modalEl = document.getElementById('deleteConfirmModal');
  const modal = modalEl ? bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl) : null;

  this.addressService.deleteAddress(this.pendingDeleteId).subscribe({
    next: () => {
      this.fetchAddresses();
      this.openDeleteSuccessModal();
      this.pendingDeleteId = null;

      if (modal) modal.hide();
    },
    error: (err) => {
      console.error('Delete address error:', err);

      // 👇 استخرج الرسالة من السيرفر
      const serverMessage: string = err.error?.message || '';

      // 🟢 مابينج الرسالة من السيرفر لمفتاح الترجمة
      let translateKey = 'errors.DELETE_FAILED';
      if (serverMessage.includes('used by orders')) {
        translateKey = 'errors.ADDRESS_IN_USE';
      }

      this.errorDeleteMessage = this.translate.instant(translateKey);

      // اقفل confirm modal وافتح error modal
      if (modal) modal.hide();

      const errorModalEl = document.getElementById('errorDeleteModal');
      if (errorModalEl) {
        const errorModal = new bootstrap.Modal(errorModalEl);
        errorModal.show();
      }
    }
  });
}


}
