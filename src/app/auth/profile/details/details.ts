import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../../../services/client.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './details.html',
  styleUrls: ['./details.scss']
})
export class Details implements OnInit {
  client: any = {
    email: '',
    phone: '',
    name: ''
  };

  constructor(private clientService: ClientService,private auth: AuthService, private router: Router,) {}

  ngOnInit(): void {
  this.clientService.getProfile().subscribe({
    next: (res) => {
      this.client = res.client;
      console.log('Client:', this.client);
    },
    error: (err) => {
      console.error('Error loading client profile:', err); // Shows full error
    }
  });
}

logout() {
  this.auth.logout().subscribe({
    next: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('client');
      this.router.navigate(['/auth']).then(() => {
        window.location.reload(); // ✅ Full page refresh after navigating
      });
    },
    error: (err) => {
      console.error('Logout failed', err);
      localStorage.removeItem('token');
      localStorage.removeItem('client');
      this.router.navigate(['/auth']).then(() => {
        window.location.reload(); // ✅ Also refresh on error fallback
      });
    }
  });
}
}
