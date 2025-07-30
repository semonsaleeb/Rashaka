import { Component, OnInit } from '@angular/core';
import { AddressService } from '../../../services/address.service';
import { AddressData } from '../../../../models/address.model';
import { CommonModule } from '@angular/common';
import { DetailsStep } from './details-step/details-step';
import { MapStep } from './map-step/map-step';

@Component({
  selector: 'app-address',
  standalone: true,
  imports: [CommonModule, DetailsStep, MapStep],
  templateUrl: './address.html',
  styleUrl: './address.scss'
})
export class Address implements OnInit {
  showSteps = false;
  step = 1;
  addressData!: AddressData;
  addressList: AddressData[] = [];

  constructor(private addressService: AddressService) {}

  ngOnInit(): void {
    this.fetchAddresses();
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
    this.addressData = { ...dataFromMap } as AddressData;
    this.step = 2;
  }

  submitAddress(finalData: AddressData) {
    this.addressService.addAddress(finalData).subscribe({
      next: (res) => {
        alert('تم إضافة العنوان بنجاح');
        this.fetchAddresses(); // Reload all addresses
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
