import { Injectable } from '@angular/core';
import { Appointment } from '../../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentStateService {
  private data: Partial<Appointment> = {};

  setData(partial: Partial<Appointment>) {
    this.data = { ...this.data, ...partial };
  }

  getData(): Partial<Appointment> {
    return this.data;
  }

  reset() {
    this.data = {};
  }
}
