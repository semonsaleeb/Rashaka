import { Component } from '@angular/core';

@Component({
  selector: 'app-checkup',
  imports: [],
  templateUrl: './checkup.html',
  styleUrl: './checkup.scss'
})
export class Checkup {
  onGetStarted() {
    console.log('Get started clicked');
    // Add your navigation logic here
  }
}
