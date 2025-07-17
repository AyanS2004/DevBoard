import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PomodoroLogComponent } from './pomodoro-log.component';

describe('PomodoroLogComponent', () => {
  let component: PomodoroLogComponent;
  let fixture: ComponentFixture<PomodoroLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PomodoroLogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PomodoroLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
