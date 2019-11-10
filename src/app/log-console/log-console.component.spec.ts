import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LogConsoleComponent } from './log-console.component';

describe('LogConsoleComponent', () => {
  let component: LogConsoleComponent;
  let fixture: ComponentFixture<LogConsoleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LogConsoleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogConsoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
