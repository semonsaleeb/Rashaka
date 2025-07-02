// home.module.ts or app.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpecialOffersComponent } from './special-offers/special-offers';

@NgModule({
  declarations: [
    SpecialOffersComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    SpecialOffersComponent
  ]
})
export class HomeModule { }

// If you're using standalone components (Angular 14+), you can make it standalone:
/*
import { Component } from '@angular/core';
import { CommonModule } from '@angular/core';

@Component({
  selector: 'app-special-offers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './special-offers.component.html',
  styleUrls: ['./special-offers.component.scss']
})
export class SpecialOffersComponent {
  // component logic here
}
*/