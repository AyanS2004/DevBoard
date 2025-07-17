import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JournalCalendarComponent } from './journal-calendar.component';

describe('JournalCalendarComponent', () => {
  let component: JournalCalendarComponent;
  let fixture: ComponentFixture<JournalCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JournalCalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JournalCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
