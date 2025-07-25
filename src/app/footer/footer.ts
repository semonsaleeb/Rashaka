import { CommonModule, ViewportScroller } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {

  constructor(private viewportScroller: ViewportScroller) {}

scrollToTop() {
  this.viewportScroller.scrollToPosition([0, 0]);
}

}
