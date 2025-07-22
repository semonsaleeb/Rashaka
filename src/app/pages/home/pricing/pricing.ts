import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-pricing',
  imports: [CommonModule],
  templateUrl: './pricing.html',
  styleUrl: './pricing.scss'
})
export class Pricing {
  constructor() { }

  selectedPlan: string = 'monthly';
  plans = [
    {
        type: 'basic',
        title: 'باقة الطموح',
        sessions: 35,
        price: '10,000',
        availablePlaces: 'الرياض فقط ', // Add this line
        features: [
            'منتجات مجانية بقيمة / 2500 ريال سعودي',
            '20 جلسات شد',
            '15 جلسات تكسير'
        ]
    },
    {
        type: 'premium',
        title: 'باقة الماسية',
        sessions: 35,
        price: '10,000',
        // availablePlaces: 'جدة و الرياض', // Add this line
        features: [
            'منتجات مجانية بقيمة / 2500 ريال سعودي',
            '20 جلسات شد',
            '15 جلسات تكسير'
        ]
    },
    {
        type: 'standard',
        title: 'باقة ذهبية',
        sessions: 35,
        price: '10,000',
        // availablePlaces: 'القصيم', // Add this line
        features: [
            'منتجات مجانية بقيمة / 2500 ريال سعودي',
            '20 جلسات شد',
            '15 جلسات تكسير'
        ]
    }
];
}
