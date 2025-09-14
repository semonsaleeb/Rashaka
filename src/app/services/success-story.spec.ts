import { TestBed } from '@angular/core/testing';

import { SuccessStory } from './success-story';

describe('SuccessStory', () => {
  let service: SuccessStory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SuccessStory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
