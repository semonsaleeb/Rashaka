import { Component, OnInit, Renderer2 } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-welcome-popup',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './welcome-popup.html',
  styleUrls: ['./welcome-popup.scss']
})
export class WelcomePopup implements OnInit {
  show = true;

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    if (this.show) {
      // منع التمرير عند ظهور popup
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
    }
  }

  close(): void {
    this.show = false;
    // إعادة التمرير بعد إغلاق popup
    this.renderer.removeStyle(document.body, 'overflow');
  }
}
