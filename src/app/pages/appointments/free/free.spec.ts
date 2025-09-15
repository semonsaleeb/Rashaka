import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Free } from './free';

describe('Free', () => {
  let component: Free;
  let fixture: ComponentFixture<Free>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Free]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Free);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
