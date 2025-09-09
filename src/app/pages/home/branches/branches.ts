import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Branch } from '../../../../models/branch.model';
import { BranchesService } from '../../../services/branches.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../../services/language.service';


@Component({
  selector: 'app-branches',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './branches.html',
  styleUrls: ['./branches.scss']
})
export class Branches implements OnInit {
  branches: Branch[] = [];
  selectedBranch: Branch | null = null;
  locations: any[] = [];
  branchSlideIndex = 0;
  visibleBranchCards = 3;
  @Input() forceVisibleCards: number | null = null;

  touchStartX = 0;
  touchEndX = 0;

  constructor(private branchesService: BranchesService,private translate: TranslateService,  private languageService: LanguageService) {}

  ngOnInit(): void {
    this.fetchBranches();
    this.updateVisibleBranchCards();
    window.addEventListener('resize', this.updateVisibleBranchCards.bind(this));
    


    this.translate.use(this.languageService.getCurrentLanguage());

    // Listen for language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.translate.use(lang);
    });
  }
  

  fetchBranches(): void {
    this.branchesService.getBranches().subscribe({
      next: res => {
        if (res.status === 'success') {
          this.branches = res.data;
          this.selectedBranch = this.branches[0] || null;
          this.updateLocationsByBranch();
        }
      },
      error: err => console.error('Failed to fetch branches', err)
    });
  }

  selectBranch(branch: Branch): void {
    this.selectedBranch = branch;
    this.updateLocationsByBranch();
  }

  updateLocationsByBranch(): void {
    if (!this.selectedBranch) return;

    // Transform API branch data into the carousel structure
    this.locations = [
      {
        phone: this.selectedBranch.mobile,
        image: 'assets/Images/Frame 37.svg', // placeholder, replace if API has image
        title: this.selectedBranch.name,
        location: this.selectedBranch.address,
        description: this.selectedBranch.status
      }
    ];

    this.branchSlideIndex = 0;
  }


  openMap(branch: Branch | null): void {
  if (!branch || !branch.latitude || !branch.longitude) return;

  const lat = branch.latitude;
  const lng = branch.longitude;

  // Open Google Maps in a new tab
  const url = `https://www.google.com/maps?q=${lat},${lng}`;
  window.open(url, '_blank');
}

  nextSlide() {
    if (this.branchSlideIndex > 0) {
      this.branchSlideIndex--;
    }
  }

  prevSlide() {
    const maxSlide = this.locations.length - this.visibleBranchCards;
    if (this.branchSlideIndex < maxSlide) {
      this.branchSlideIndex++;
    }
  }

  getBranchDotsArray(): number[] {
    const totalSlides = Math.ceil(this.locations.length / this.visibleBranchCards);
    return Array.from({ length: totalSlides }, (_, i) => i);
  }

  goToBranchSlide(index: number): void {
    this.branchSlideIndex = index;
  }

  updateVisibleBranchCards(): void {
    const width = window.innerWidth;

    if (width < 576) {
      this.visibleBranchCards = 1;
      return;
    }

    if (this.forceVisibleCards !== null) {
      this.visibleBranchCards = this.forceVisibleCards;
      return;
    }

    this.visibleBranchCards = width >= 576 && width < 992 ? 2 : 3;
  }

  getMaxBranchSlideIndex(): number {
    return Math.max(0, this.locations.length - this.visibleBranchCards);
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  handleSwipe(): void {
    const swipeDistance = this.touchEndX - this.touchStartX;

    if (Math.abs(swipeDistance) > 50) {
      swipeDistance > 0 ? this.prevSlide() : this.nextSlide();
    }
  }
}
