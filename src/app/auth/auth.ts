import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Login } from './login/login';
import { Register } from './register/register';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, Login, Register, RouterModule],
  templateUrl: './auth.html',
  styleUrls: ['./auth.scss']
})
export class Auth {
  activeTab: 'login' | 'register' = 'login'; // Default tab

  setTab(tab: 'login' | 'register') {
    this.activeTab = tab;
  }
}
