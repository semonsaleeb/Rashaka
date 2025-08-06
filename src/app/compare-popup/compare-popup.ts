import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-compare-popup',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './compare-popup.html',
  styleUrls: ['./compare-popup.scss']
})
export class ComparePopup implements OnInit {
  @Input() products: any[] = [];
  @Output() close = new EventEmitter<void>();
  comparedData: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const names = this.products.map(p => p.name).join(',');
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    });

    this.http.get(`${environment.apiBaseUrl}/products/search-multiple?q=${names}`, { headers })
      .subscribe((res: any) => {
        this.comparedData = res.data;
      });
  }

  closePopup() {
    this.close.emit();
  }
}
