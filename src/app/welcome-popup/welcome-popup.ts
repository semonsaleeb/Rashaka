
import { Component, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-welcome-popup',
  imports: [TranslateModule],
  templateUrl: './welcome-popup.html',
  styleUrl: './welcome-popup.scss'
})
export class WelcomePopup implements OnInit {
  show = true;

  constructor() {}

  ngOnInit(): void {
    // You can add logic here to check if popup was already shown in session/local storage
  }

  close(): void {
    this.show = false;
  }}