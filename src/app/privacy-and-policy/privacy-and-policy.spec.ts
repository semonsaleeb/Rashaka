import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivacyAndPolicy } from './privacy-and-policy';

describe('PrivacyAndPolicy', () => {
  let component: PrivacyAndPolicy;
  let fixture: ComponentFixture<PrivacyAndPolicy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrivacyAndPolicy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrivacyAndPolicy);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
