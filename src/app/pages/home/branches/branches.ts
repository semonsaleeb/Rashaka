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
  cities: any[] = []; // المدن بدون تكرار
  selectedCity: any = null; // المدينة المختارة
  selectedBranch: Branch | null = null;
  locations: any[] = [];
  branchSlideIndex = 0;
  visibleBranchCards = 3;
  @Input() forceVisibleCards: number | null = null;

  touchStartX = 0;
  touchEndX = 0;
  currentLang: string = 'ar';

  constructor(
    private branchesService: BranchesService,
    private translate: TranslateService,  
    private languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.fetchCities();
    this.updateVisibleBranchCards();
    window.addEventListener('resize', this.updateVisibleBranchCards.bind(this));

    this.currentLang = this.languageService.getCurrentLanguage();
    this.translate.use(this.currentLang);

    // Listen for language changes
    this.languageService.currentLang$.subscribe(lang => {
      this.currentLang = lang;
      this.translate.use(lang);
    });
  }

  // جلب جميع المدن المتاحة من الفروع
  fetchCities(): void {
    this.branchesService.getBranches().subscribe({
      next: res => {
        if (res.status === 'success') {
          this.branches = res.data;
          this.extractUniqueCities();
          this.selectFirstCity();
        }
      },
      error: err => console.error('Failed to fetch branches', err)
    });
  }

  // استخراج المدن بدون تكرار من الفروع
  extractUniqueCities(): void {
    const cityMap = new Map();
    
    this.branches.forEach(branch => {
      if (branch.city && branch.city.id) {
        if (!cityMap.has(branch.city.id)) {
          cityMap.set(branch.city.id, {
            id: branch.city.id,
            name: branch.city.name,
            name_en: branch.city.name_en,
            name_ar: branch.city.name_ar,
            branchCount: 0
          });
        }
        // زيادة عدد الفروع في هذه المدينة
        const city = cityMap.get(branch.city.id);
        city.branchCount++;
      }
    });

    this.cities = Array.from(cityMap.values());
    console.log('🏙️ المدن المستخرجة:', this.cities);
  }

  // اختيار أول مدينة افتراضياً
  selectFirstCity(): void {
    if (this.cities.length > 0) {
      this.selectCity(this.cities[0]);
    }
  }

  // اختيار مدينة وتصفية الفروع حسب المدينة
  selectCity(city: any): void {
    this.selectedCity = city;
    this.fetchBranchesByCity(city.id);
  }

  // جلب الفروع حسب المدينة المختارة
  fetchBranchesByCity(cityId: number): void {
    this.branchesService.getBranchesByCity(cityId).subscribe({
      next: res => {
        if (res.status === 'success') {
          const cityBranches = res.data;
          this.updateLocationsWithBranches(cityBranches);
          
          // اختيار أول فرع تلقائياً
          this.selectedBranch = cityBranches[0] || null;
        }
      },
      error: err => console.error('Failed to fetch branches by city', err)
    });
  }

  // تحديث الـ locations مع الفروع المصفاة
  updateLocationsWithBranches(branches: Branch[]): void {
    this.locations = branches.map((branch: Branch) => ({
      id: branch.id,
      phone: branch.mobile,
      image: 'assets/Images/Frame 37.svg',
      title: branch.name,
      location: branch.address,
      city: this.currentLang === 'ar' ? branch.city?.name_ar : branch.city?.name_en,
      description: branch.status,
      latitude: branch.latitude,
      longitude: branch.longitude,
      branch: branch // حفظ كائن الفرع الكامل
    }));

    this.branchSlideIndex = 0;
    console.log('📍 الفروع المصفاة حسب المدينة:', this.locations);
  }

  // اختيار فرع محدد
  selectBranch(branch: Branch): void {
    this.selectedBranch = branch;
    this.updateLocationsByBranch();
  }

  // تحديث الـ locations بناء على فرع محدد (فرع واحد فقط)
  updateLocationsByBranch(): void {
    if (!this.selectedBranch) return;

    this.locations = [
      {
        id: this.selectedBranch.id,
        phone: this.selectedBranch.mobile,
        image: 'assets/Images/Frame 37.svg',
        title: this.selectedBranch.name,
        location: this.selectedBranch.address,
        city: this.currentLang === 'ar' ? this.selectedBranch.city?.name_ar : this.selectedBranch.city?.name_en,
        description: this.selectedBranch.status,
        latitude: this.selectedBranch.latitude,
        longitude: this.selectedBranch.longitude,
        branch: this.selectedBranch
      }
    ];

    this.branchSlideIndex = 0;
  }

  openMap(location: any): void {
    if (!location || !location.latitude || !location.longitude) return;

    const lat = location.latitude;
    const lng = location.longitude;

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