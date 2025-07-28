import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Downloadapp } from '../downloadapp/downloadapp';
import { SucesStory } from '../suces-story/suces-story';

@Component({
  selector: 'app-pricing',
  imports: [CommonModule, Downloadapp, SucesStory],
  templateUrl: './pricing.html',
  styleUrl: './pricing.scss'
})
export class Pricing {
      @Input() mode: 'carousel' | 'grid' = 'grid';
    
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
            '15 جلسات تكسير',
            'متابعة أسبوعية مع أخصائيين تغذية لمدة شهرين.'
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
