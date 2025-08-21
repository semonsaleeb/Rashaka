
import { Component } from '@angular/core';
import { Branches } from '../home/branches/branches';
import { SucesStory } from '../home/suces-story/suces-story';
import { Branch } from "../appointments/branch/branch";

@Component({
  selector: 'app-about-us',
  imports: [Branches, SucesStory, Branches],
  templateUrl: './about-us.html',
  styleUrl: './about-us.scss'
})
export class AboutUs {
 stats = [
    { value: '40+', label: 'فرع' },
    { value: '285+', label: 'مبلغ' },
    { value: '500+', label: 'موظف' },
    { value: '100,000+', label: 'عميل' }
  ];
}
