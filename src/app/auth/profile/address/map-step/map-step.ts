import {
  Component,
  EventEmitter,
  Output,
  AfterViewInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import * as L from 'leaflet';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AddressData } from '../../../../../models/address.model';


L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png',
});

@Component({
  selector: 'app-map-step',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  templateUrl: './map-step.html',
  styleUrls: ['./map-step.scss']
})
export class MapStep implements AfterViewInit {
  @Output() next = new EventEmitter<Partial<AddressData>>();

  location_type = 'home';
  coordinate: string = '';
  government_name = '';
  city_name = '';
  area_name = '';
  street_name = '';
  building_number = '';
  searchQuery: string = '';

  private map!: L.Map;
  private marker!: L.Marker;

  constructor(private http: HttpClient) {}

  ngAfterViewInit(): void {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png'
    });

    this.map = L.map('map').setView([30.0444, 31.2357], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);
      this.coordinate = `${lat},${lng}`;
      this.setMarker(e.latlng.lat, e.latlng.lng);
      this.reverseGeocode(lat, lng);
    });
  }

  setMarker(lat: number, lng: number) {
    const latLng = L.latLng(lat, lng);
    if (this.marker) {
      this.marker.setLatLng(latLng);
    } else {
      this.marker = L.marker(latLng).addTo(this.map);
    }
    this.map.setView(latLng, 15); // تقريب الخريطة على الموقع
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          this.coordinate = `${lat.toFixed(6)},${lng.toFixed(6)}`;
          this.setMarker(lat, lng);
          this.reverseGeocode(lat.toString(), lng.toString());
        },
        (error) => {
          alert('تعذر تحديد الموقع');
          console.error(error);
        }
      );
    } else {
      alert('المتصفح لا يدعم تحديد الموقع');
    }
  }

  searchLocation() {
    if (!this.searchQuery.trim()) {
      alert('اكتب اسم الموقع أولًا');
      return;
    }

    const query = encodeURIComponent(this.searchQuery);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;

    this.http.get<any[]>(url).subscribe((results) => {
      if (results.length === 0) {
        alert('لم يتم العثور على الموقع');
        return;
      }

      const lat = parseFloat(results[0].lat);
      const lng = parseFloat(results[0].lon);
      this.coordinate = `${lat.toFixed(6)},${lng.toFixed(6)}`;
      this.setMarker(lat, lng);
      this.reverseGeocode(lat.toString(), lng.toString());
    });
  }

  reverseGeocode(lat: string, lng: string) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    this.http.get<any>(url).subscribe((res) => {
      const address = res.address;

      this.government_name = address.state || '';
      this.city_name = address.city || address.town || address.village || '';
      this.area_name = address.suburb || address.neighbourhood || '';
      this.street_name = address.road || '';
      this.building_number = address.house_number || '';
    });
  }

  nextStep() {
    if (!this.coordinate) {
      alert("اختر موقعًا على الخريطة");
      return;
    }

    const missingFields: string[] = [];

    if (!this.government_name) missingFields.push('المحافظة');
    if (!this.city_name) missingFields.push('المدينة');
    if (!this.area_name) missingFields.push('الحي');
    if (!this.street_name) missingFields.push('اسم الشارع');
    if (!this.building_number) missingFields.push('رقم المبنى');

    if (missingFields.length > 0) {
      alert(`يرجى ملء الحقول التالية:\n- ${missingFields.join('\n- ')}`);
      return;
    }

    this.next.emit({
      coordinate: this.coordinate,
      location_type: this.location_type,
      government_name: this.government_name,
      city_name: this.city_name,
      area_name: this.area_name,
      street_name: this.street_name,
      building_number: this.building_number,
    });
  }
}
