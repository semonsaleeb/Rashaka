import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpecialOffers } from './special-offers';

describe('SpecialOffers', () => {
  let component: SpecialOffers;
  let fixture: ComponentFixture<SpecialOffers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpecialOffers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpecialOffers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
