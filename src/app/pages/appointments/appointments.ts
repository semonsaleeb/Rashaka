import { Component, OnInit } from '@angular/core';
import { Branch } from './branch/branch';
import { Spicialist } from './spicialist/spicialist';
import { Confirm } from './confirm/confirm';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

declare var bootstrap: any; // عشان نقدر نستدعي Bootstrap Modal

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [Branch, Spicialist, Confirm, CommonModule],
  templateUrl: './appointments.html',
  styleUrls: ['./appointments.scss']
})
export class Appointments implements OnInit {
  step = 1;
  token: string | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.token = localStorage.getItem('token');

    if (!this.token) {
      // افتح المودال أول ما يدخل
      const modalEl = document.getElementById('authModal');
      if (modalEl) {
        const myModal = new bootstrap.Modal(modalEl, {
          backdrop: 'static',
          keyboard: false
        });
        myModal.show();
      }
    }
  }

  goToStep(step: number) {
    this.step = step;
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }
}
