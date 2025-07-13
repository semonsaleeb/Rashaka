import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Downloadapp } from './downloadapp';

describe('Downloadapp', () => {
  let component: Downloadapp;
  let fixture: ComponentFixture<Downloadapp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Downloadapp]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Downloadapp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
