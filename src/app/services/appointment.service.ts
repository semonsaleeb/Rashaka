import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment } from '../../models/appointment.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getAppointments(params?: any): Observable<{ status: string; data: Appointment[] }> {
    return this.http.get<{ status: string; data: Appointment[] }>(`${this.baseUrl}/appointments`, { params });
  }

  createAppointment(appointment: any): Observable<{ status: string; appointment: Appointment }> {
    return this.http.post<{ status: string; appointment: Appointment }>(
      `${this.baseUrl}/make-appointment`,
      appointment
    );
  }

  cancelAppointment(appointmentId: number): Observable<{ status: string; appointment: Appointment }> {
    return this.http.post<{ status: string; appointment: Appointment }>(
      `${this.baseUrl}/appointments/${appointmentId}/cancel`,
      {}
    );
  }

  updateAppointmentTime(appointmentId: number, data: { date: string; start: string }): Observable<{ status: string; appointment: Appointment }> {
    return this.http.put<{ status: string; appointment: Appointment }>(
      `${this.baseUrl}/appointments/${appointmentId}/updateTime`,
      data
    );
  }

  getUpcomingAppointments(status?: string[]): Observable<{ status: string; data: Appointment[] }> {
    const params: any = {};
    if (status) params.status = status;
    return this.http.get<{ status: string; data: Appointment[] }>(`${this.baseUrl}/appointments/upcoming`, { params });
  }

  getPastAppointments(status?: string[]): Observable<{ status: string; data: Appointment[] }> {
    const params: any = {};
    if (status) params.status = status;
    return this.http.get<{ status: string; data: Appointment[] }>(`${this.baseUrl}/appointments/past`, { params });
  }
}
