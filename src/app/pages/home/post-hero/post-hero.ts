import { Component } from '@angular/core';

@Component({
  selector: 'app-post-hero',
  imports: [],
  templateUrl: './post-hero.html',
  styleUrl: './post-hero.scss'
})
export class PostHero {
  stats = [
    { number: '20+', label: 'فرع', description: 'Branches' },
    { number: '285+', label: 'منتج', description: 'Products' },
    { number: '500+', label: 'موظف', description: 'Employees' },
    { number: '100,000+', label: 'عميل', description: 'Clients' }
  ];
}
