import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../../../services/client.service';

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

  constructor(private clientService: ClientService) {}

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

}
