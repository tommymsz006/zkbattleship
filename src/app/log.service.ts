import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  logBuffer: string[] = [];

  addMessage(message : string) {
  	this.logBuffer.unshift(`${new Date().toLocaleString()}: ${message}`);
  }

  add(obj) {
  	this.logBuffer.unshift(obj.toString());
  }

  clear() {
  	//this.logBuffer = [];
    this.logBuffer.length = 0;	// reset array and sync all references
  }

  constructor() { }
}
