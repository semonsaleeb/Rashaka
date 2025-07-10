import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SucesStory } from './suces-story';

describe('SucesStory', () => {
  let component: SucesStory;
  let fixture: ComponentFixture<SucesStory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SucesStory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SucesStory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
