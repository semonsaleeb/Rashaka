import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailsStep } from './details-step';

describe('DetailsStep', () => {
  let component: DetailsStep;
  let fixture: ComponentFixture<DetailsStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetailsStep]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailsStep);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
