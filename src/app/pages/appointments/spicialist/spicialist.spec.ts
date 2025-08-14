import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Spicialist } from './spicialist';

describe('Spicialist', () => {
  let component: Spicialist;
  let fixture: ComponentFixture<Spicialist>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Spicialist]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Spicialist);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
