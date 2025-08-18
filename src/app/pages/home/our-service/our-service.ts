import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SucesStory } from '../suces-story/suces-story';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-our-service',
  templateUrl: './our-service.html',
  styleUrls: ['./our-service.scss'],
  standalone:true,
  imports: [CommonModule, RouterModule],
})
export class OurService {
  cards = [
    {
      icon: 'assets/Images/22. Stethoscope.svg',
      title: 'فحص مجاني',
      description: 'نعرفك على احتياج جسمك الحقيقي من سعرات ونسية الدفون...'
    },
    {
      icon: 'assets/Images/Doctor.svg',
      title: 'متابعة دورية',
      description: 'نعرفك على احتياج جسمك الحقيقي من سعرات ونسية الدفون...'
    },
    {
      icon: 'assets/Images/Rice Bowl.svg',
      title: 'منتجات تخسيس',
      description: 'نعرفك على احتياج جسمك الحقيقي من سعرات ونسية الدفون...'
    }
  ];

  onGetStarted() {
    console.log('Get started clicked');
    // هنا ممكن تضيف التنقل أو أي أكشن
  }
}
