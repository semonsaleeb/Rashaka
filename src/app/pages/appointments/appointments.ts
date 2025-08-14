import { Component } from '@angular/core';
import { Branch } from './branch/branch';
import { Spicialist } from './spicialist/spicialist';
import { Confirm } from './confirm/confirm';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [Branch, Spicialist, Confirm, CommonModule],
  templateUrl: './appointments.html',
  styleUrls: ['./appointments.scss']
})
export class Appointments {
  step = 1;

  goToStep(step: number) {
    this.step = step;
  }
}
