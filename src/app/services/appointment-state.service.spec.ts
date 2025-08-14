import { TestBed } from '@angular/core/testing';

import { AppointmentStateService } from './appointment-state.service';

describe('AppointmentStateService', () => {
  let service: AppointmentStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppointmentStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
