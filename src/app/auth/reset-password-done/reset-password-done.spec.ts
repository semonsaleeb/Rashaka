import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetPasswordDone } from './reset-password-done';

describe('ResetPasswordDone', () => {
  let component: ResetPasswordDone;
  let fixture: ComponentFixture<ResetPasswordDone>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordDone]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResetPasswordDone);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
