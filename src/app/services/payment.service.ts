// // src/app/services/payment.service.ts
// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { environment } from '../../environments/environment';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class PaymentService {
//   constructor(private http: HttpClient) {}

//   // دفع عبر MyFatoorah
//   initiatePayment(paymentData: any): Observable<any> {
//     const headers = new HttpHeaders({
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${environment.myFatoorahApiKey}`
//     });

//     return this.http.post(
//       `${environment.myFatoorahBaseUrl}/v2/SendPayment`,
//       paymentData,
//       { headers }
//     );
//   }

//   // الحصول على حالة الدفع
//   getPaymentStatus(paymentId: string): Observable<any> {
//     const headers = new HttpHeaders({
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${environment.myFatoorahApiKey}`
//     });

//     return this.http.get(
//       `${environment.myFatoorahBaseUrl}/v2/GetPaymentStatus`,
//       { 
//         headers,
//         params: { Key: paymentId, KeyType: 'PaymentId' }
//       }
//     );
//   }
// }


import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = '/fatoorah-api/v2/SendPayment';

  constructor(private http: HttpClient) {}

  initiatePayment(body: any) {
    const headers = new HttpHeaders({
      Authorization: `Bearer QU5B_LUdoeZHdliM09PdwL9tBlLpD8oOfEAaRTLnBbDbxs25352n2aEKbSn4VBnl-9wT4kD0KyCO3SBgxAefDN-_Y0lS1qUmREuwH-KQ4jhOff23a3TrMDE3keIMm212_aEvZCE7dABiuXx2B4wT4Qs5mL1wp--TriwseWwTkVz8TtXscXUcrhHLhhH1ck-6YX2hzj9KpOqL69BYp15PRG8C1kWh5mV8zPvfEUkggmuLmHzZknBefokRl3deKNdjEK0e6uRWE4ozm4kODP9TiPIHrcOlGTm0vV-FdvYsgTVa34j9lO4i6bOUbeWX5pdvjhVSmGhbg7CYZXbR0lkrq4D0BDYiXn93WgiCxBPV5Tb8Ffyc_f5bWPR4YpQomq39hlQo33KcfkQvFmQ4Hj0fFdaPIDfEgd567XOLSbgxJTPtOY-K0JQjJKTn9sMc9ybkz8_Eo0GAGSEPwFddzHDyLaE7ecY9vkT_VTu2C_jP31MKY2fq5ADlS75MISbioXzkH6KNlSJ-sMIv0R6nvi1AuYxvSBTKrFSETo97PMwVowJju16byyLnibT1Pw0jwX4L2URM1IymI3GfZ10ZVqOsRBBIG0kOqdsM0fA4JQJWwzz2r8gqLRq60Ei_eI2MfmLbBXyyMJemfBh1oZqUJPJWiTeKLIebo7gtqet6BBTc46F6EM8S`
    });

    return this.http.post(this.apiUrl, body, { headers });
  }
}
