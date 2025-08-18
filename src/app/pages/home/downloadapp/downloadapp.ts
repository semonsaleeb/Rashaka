import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-downloadapp',
  imports: [],
  templateUrl: './downloadapp.html',
  styleUrl: './downloadapp.scss'
})
export class Downloadapp  {
  
  // هنا عرفنا المتغير عشان يبان في الـ HTML
  isMobile: boolean = window.innerWidth < 768;

  // لما يتغير حجم الشاشة يحدث المتغير
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile = event.target.innerWidth < 768;
  }
}