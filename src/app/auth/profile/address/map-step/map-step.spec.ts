import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapStep } from './map-step';

describe('MapStep', () => {
  let component: MapStep;
  let fixture: ComponentFixture<MapStep>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapStep]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapStep);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
