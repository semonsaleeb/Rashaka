import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-branches',
  imports: [CommonModule],
  templateUrl: './branches.html',
  styleUrl: './branches.scss'
})
export class Branches {
branches: string[] = ['الخبر', 'الدمام', 'الأحساء', 'جدة', 'القصيم', 'الخرج', 'الرياض'];
selectedBranch: string = 'الرياض';

selectBranch(branch: string): void {
  this.selectedBranch = branch;
}

locations = [
  {
    phone: '966-920013458',
    image: 'assets/Images/Frame 37.svg',
    title: 'أولي فروعنا',
    location: 'الرياض – الرياض النخيل',
    description: 'مركز العناية بالشعر و التجميل'
  },
  {
    phone: '966-920013458',
    image: 'assets/Images/Frame 37.svg',
    title: 'ثاني فروعنا',
    location: 'جدة – حي الروضة',
    description: 'مركز التجميل والعناية بالبشرة'
  },
  {
    phone: '966-920013458',
    image: 'assets/Images/Frame 37.svg',
    title: 'ثالث فروعنا',
    location: 'الدمام – حي الشاطئ',
    description: 'مركز متكامل للعناية بالشعر'
  }
];


}
