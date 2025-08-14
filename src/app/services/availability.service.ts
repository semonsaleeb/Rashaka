import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Appointment } from '../../models/appointment.model';

@Injectable({
  providedIn: 'root',
})
export class AvailabilityService {
  private centersUrl = `${environment.apiCentersUrl}/client`;

  constructor(private http: HttpClient) {}

getCentersAvailability(params?: any): Observable<any> {
  console.log('📡 Fetching centers availability');
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`,
  });
  return this.http.get(`${this.centersUrl}/centers/availability`, { headers });
}


createAppointment(appointment: any): Observable<{ status: string; appointment: Appointment }> {
  const token = localStorage.getItem('token');

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`,
    Accept: 'application/json'
  });

  return this.http.post<{ status: string; appointment: Appointment }>(
    `${environment.apiCentersUrl}/client/make-appointment`, // apiCentersUrl مفيهوش client
    appointment,
    { headers }
  );
}

getClientAppointments() {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
  return this.http.get<any>(`${this.centersUrl}/appointments`, { headers });
}

cancelAppointment(id: number): Observable<any> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`,
    Accept: 'application/json'
  });

  return this.http.post(
    `${environment.apiCentersUrl}/client/appointments/${id}/cancel`,
    {},
    { headers }
  );
}


updateAppointmentTime(id: number, date: string, start: string) {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`,
    Accept: 'application/json'
  });
  return this.http.put(`${environment.apiCentersUrl}/appointments/${id}/updateTime`,
    { date, start },
    { headers }
  );
}


}
