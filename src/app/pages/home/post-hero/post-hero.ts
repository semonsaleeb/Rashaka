import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  AfterViewInit,
  ViewChildren,
  QueryList
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-post-hero',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './post-hero.html',
  styleUrl: './post-hero.scss'
})
export class PostHero implements AfterViewInit {
  stats = [
    { number: 40, suffix: '+', textKey: 'STATS.BRANCHES', description: 'Branches' },
    { number: 285, suffix: '+', textKey: 'STATS.PRODUCTS', description: 'Products' },
    { number: 500, suffix: '+', textKey: 'STATS.EMPLOYEES', description: 'Employees' },
    { number: 100000, suffix: '+', textKey: 'STATS.CLIENTS', description: 'Clients' }
  ];

  @ViewChildren('statNumber') statNumbers!: QueryList<ElementRef>;

  ngAfterViewInit() {
    this.statNumbers.forEach((elRef, index) => {
      const target = this.stats[index].number;
      const suffix = this.stats[index].suffix || '';
      let count = 0;
      const step = Math.ceil(target / 300);

      const interval = setInterval(() => {
        count += step;
        if (count >= target) {
          count = target;
          clearInterval(interval);
        }
        elRef.nativeElement.textContent = this.formatNumber(count) + suffix;
      }, 20);
    });
  }

  formatNumber(num: number): string {
    return num.toLocaleString();
  }
}
