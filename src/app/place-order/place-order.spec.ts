import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaceOrder } from './place-order';

describe('PlaceOrder', () => {
  let component: PlaceOrder;
  let fixture: ComponentFixture<PlaceOrder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaceOrder]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlaceOrder);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
