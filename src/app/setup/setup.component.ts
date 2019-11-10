import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CdkDrag, CdkDropList, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { Cell } from '../cell';
import { Ship, ShipOrientation } from '../ship';

import { GameService } from '../game.service';
import { LogService } from '../log.service';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.component.html',
  styleUrls: ['./setup.component.css']
})
export class SetupComponent implements OnInit {
	ships: Ship[];
	displayBoard: Ship[][][];

  constructor(
    private gameService: GameService,
    private logService : LogService,
    private router: Router
  ) { }

  ngOnInit() {
    // new game
    this.gameService.newGame();

    // ships
    this.ships = this.gameService.getShips().slice();

    // initialize the board of ship arrays (for drag/drop)
    this.displayBoard = [];
  	for(let i: number = 0; i < this.gameService.BOARD_HEIGHT; i++) {
  		this.displayBoard[i] = [];
  		for(let j: number = 0; j < this.gameService.BOARD_WIDTH; j++) {
  			this.displayBoard[i][j] = [];
  		}
    }

    this.logService.addMessage("Game setup completed!");
  }

  dropShip(event: CdkDragDrop<Ship[]>) {
  	console.log(event);
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
    else if (event.container.id.substring(0, 5) === 'cell_') {	// if it's dropped into the game board

      let tokens = event.container.id.split('_');
      let ship: Ship = event.previousContainer.data[event.previousIndex];
      if (this.gameService.addShipToBoard(ship, Number(tokens[1]), Number(tokens[2]))) {		// if successfully added to the game board
	      transferArrayItem(event.previousContainer.data,
	                        event.container.data,
	                        event.previousIndex,
	                        event.currentIndex);

	      // if it's dropped into the ship board, then extend the whole size of the given ship
        for (let i: number = 1; i < ship.size; i++){
          this.displayBoard[(ship.orientation === ShipOrientation.Vertical)? ship.y + i : ship.y]
                    				[(ship.orientation === ShipOrientation.Horizontal)? ship.x + i : ship.x].push(ship);
        }
      }
      // do nothing if failed
    }
  }

  startGame() {
  	this.router.navigateByUrl('/board');
  }

  changeOrientation(ship: Ship) {
  	ship.rotate();
    return false;
  }

  isShipTypeEqual(ship: Ship, shipType: string) : boolean {
    return ship.constructor.name === shipType;  
  }

  // generate dummy array to represent veritical space of the given ship
  verticalArray(ship: Ship) {
    return (new Array((ship.orientation === ShipOrientation.Vertical)? ship.size : 1)).fill(1);
  }

  // generate dummy array to represent horizontal space of the given ship
  horizontalArray(ship: Ship) {
    return (new Array((ship.orientation === ShipOrientation.Horizontal)? ship.size : 1)).fill(1);
  }

  oneItemOnlyPredicate(item: CdkDrag<Ship>, drop: CdkDropList<Ship[]>) {
    return drop.data.length <= 0;
  }
}
