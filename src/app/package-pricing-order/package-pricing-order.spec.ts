import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackagePricingOrder } from './package-pricing-order';

describe('PackagePricingOrder', () => {
  let component: PackagePricingOrder;
  let fixture: ComponentFixture<PackagePricingOrder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PackagePricingOrder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PackagePricingOrder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
