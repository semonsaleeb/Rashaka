import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpecialOffersComponent } from './special-offers/special-offers';
// DO NOT import SpecialOffersComponent here

@NgModule({
  declarations: [
    // Declare other non-standalone components here
  ],
  imports: [
    CommonModule, SpecialOffersComponent
    // Other shared modules
  ],
  exports: [
    // Export non-standalone components if needed
  ]
})
export class HomeModule {}
