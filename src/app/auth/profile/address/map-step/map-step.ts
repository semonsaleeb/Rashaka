import {
  Component,
  EventEmitter,
  Output,
  AfterViewInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { AddressData } from '../../../../../models/address.model';

// 🟡 Fix: Override Leaflet marker icons to use local /assets/ versions
import 'leaflet/dist/images/marker-icon.png';
import 'leaflet/dist/images/marker-icon-2x.png';
import 'leaflet/dist/images/marker-shadow.png';

@Component({
  selector: 'app-map-step',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './map-step.html',
  styleUrls: ['./map-step.scss']
})
export class MapStep implements AfterViewInit {
  @Output() next = new EventEmitter<Partial<AddressData>>();
  location_type = 'home';
  coordinate: string = '';

  private map!: L.Map;
  private marker!: L.Marker;

  ngAfterViewInit(): void {
    // ✅ Fix: Set correct marker icon paths (after copying to /assets/)
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png'
    });

    // 🗺️ Initialize map centered on Cairo
    this.map = L.map('map').setView([30.0444, 31.2357], 13);

    // 🌍 Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    // 📍 Handle map click to set marker and coordinates
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat.toFixed(6);
      const lng = e.latlng.lng.toFixed(6);
      this.coordinate = `${lat},${lng}`;

      if (this.marker) {
        this.marker.setLatLng(e.latlng);
      } else {
        this.marker = L.marker(e.latlng).addTo(this.map);
      }
    });
  }

  // ▶️ Emit selected location + type to parent
  nextStep() {
    if (!this.coordinate) {
      alert("اختر موقعًا على الخريطة");
      return;
    }

    // 🟢 داخل nextStep()
this.next.emit({
  coordinate: this.coordinate,
  location_type: this.location_type
});


  }
}
