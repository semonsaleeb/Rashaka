import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientOpinion } from './client-opinion';

describe('ClientOpinion', () => {
  let component: ClientOpinion;
  let fixture: ComponentFixture<ClientOpinion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientOpinion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientOpinion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
