import { Component } from '@angular/core';

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.scss'
})
export class Hero {
  currentWeight: number = 160;
  targetWeight: number = 80;
  
  stats = [
    { label: 'منتجات صحية', value: '502 Hug x 74 Hug', icon: '✓' },
    { label: 'متابعة أسبوعية', value: '', icon: '✓' },
    { label: 'فحص مجاني', value: '', icon: '✓' }
  ];

  constructor() { }

  onGetStarted() {
    console.log('Get started clicked');
    // Add your navigation log
  }
}
