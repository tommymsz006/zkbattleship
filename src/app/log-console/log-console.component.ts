import { Component, OnInit } from '@angular/core';
import { LogService } from '../log.service';

@Component({
  selector: 'app-log-console',
  templateUrl: './log-console.component.html',
  styleUrls: ['./log-console.component.css']
})
export class LogConsoleComponent implements OnInit {

  constructor(public logService: LogService) { }

  ngOnInit() {
  }

}
