import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparePopup } from './compare-popup';

describe('ComparePopup', () => {
  let component: ComparePopup;
  let fixture: ComponentFixture<ComparePopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComparePopup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComparePopup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
