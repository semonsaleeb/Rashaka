import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WelcomePopup } from './welcome-popup';

describe('WelcomePopup', () => {
  let component: WelcomePopup;
  let fixture: ComponentFixture<WelcomePopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WelcomePopup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WelcomePopup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
