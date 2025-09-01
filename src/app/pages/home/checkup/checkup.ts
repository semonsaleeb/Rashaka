import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-checkup',
  imports: [RouterModule],
  templateUrl: './checkup.html',
  styleUrl: './checkup.scss'
})
export class Checkup {
  onGetStarted() {
    console.log('Get started clicked');
    // Add your navigation logic here
  }
}
