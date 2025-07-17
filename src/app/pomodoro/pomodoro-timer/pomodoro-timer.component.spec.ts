import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PomodoroTimerComponent } from './pomodoro-timer.component';

describe('PomodoroTimerComponent', () => {
  let component: PomodoroTimerComponent;
  let fixture: ComponentFixture<PomodoroTimerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PomodoroTimerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PomodoroTimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
