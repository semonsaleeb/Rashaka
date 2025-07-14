import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Login } from './login/login';
import { Register } from './register/register';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, Login, Register],
  templateUrl: './auth.html',
  styleUrls: ['./auth.scss']
})
export class Auth {
  activeTab: 'login' | 'register' = 'login'; // default is login
}
