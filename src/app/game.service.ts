import { Injectable } from '@angular/core';

import { Cell, CellState } from './cell';
import { Ship, ShipState, ShipOrientation, Carrier, Battleship, Cruiser, Submarine, Destroyer } from './ship';

@Injectable({
  providedIn: 'root'
})

export class GameService {
  board: Cell[][];
  ships: Ship[];
  turn: number = 0;
  readonly BOARD_HEIGHT = 10;
  readonly BOARD_WIDTH = 10;

  constructor() {
  }

  newGame() {
    this.board = [];
    for(let i: number = 0; i < this.BOARD_HEIGHT; i++) {
      this.board[i] = [];
      for(let j: number = 0; j < this.BOARD_WIDTH; j++) {
        this.board[i][j] = new Cell(j, i);
      }
    }

    this.ships = [  new Carrier(),
                    new Battleship(),
                    new Cruiser(),
                    new Submarine(),
                    new Destroyer()];

    this.turn = 0;
  }

  getBoard() : Cell[][] {
  	return this.board;
  }

  getTurn() : number {
  	return this.turn;
  }

  getCell(x: number, y: number) : Cell {
  	return this.board[y][x];
  }

  getShips() : Ship[] {
  	return this.ships;
  }

  isAllDeployed(): boolean {
    let result: boolean = (this.ships !== undefined && this.ships.length > 0);
    if (result) {
      for (let ship of this.ships) {
        if (result && ship.state === ShipState.Undeployed) {
          result = false;
        }
      }
    }
    return result;
  }

  addShipToBoard(ship: Ship, x: number, y: number) : boolean {
  	let isAllowed: boolean = !(	x < 0 || y < 0 || x >= this.BOARD_WIDTH || y >= this.BOARD_HEIGHT ||
  				(ship.orientation === ShipOrientation.Horizontal && x + ship.size > this.BOARD_WIDTH) ||
  				(ship.orientation === ShipOrientation.Vertical && y + ship.size > this.BOARD_HEIGHT));

		// actually place it on the board
  	if (isAllowed) {
  		let maxX = (ship.orientation === ShipOrientation.Horizontal) ? x + ship.size : x + 1;
  		let maxY = (ship.orientation === ShipOrientation.Vertical) ? y + ship.size : y + 1;
		  
		  let shipCells: Cell[] = [];
		  // precheck if all cells are vacant before placing the ship
		  for (let i = x; i < maxX; i++) {
		  	for (let j = y; j < maxY; j++) {
	  			if (this.board[j][i].state === CellState.Vacant) {
	  				shipCells.push(this.board[j][i]);
	  			} else {
	  				isAllowed = false;
	  			}
	  		}
		  }

		  // place the ship
		  if (isAllowed) {
        ship.deploy(x, y);

			  while(shipCells.length > 0) {
			  	shipCells.pop().occupy();
			  }
			}
		}

	  return isAllowed;
  }

  fire(cell: Cell) : boolean {
  	let isSucceed: boolean = cell.fire();
  	if (isSucceed) {
      if (cell.state === CellState.Hit) {
        this.checkDamagedShip(cell);
      }
  		this.turn++;
  	}
  	return isSucceed;
  }

  getShipByCell(cell: Cell) : Ship {
    let resultShip: Ship = null;
    for (let ship of this.ships) {
      // check if a given ship is hit
      if (resultShip === null &&
          ((ship.orientation === ShipOrientation.Vertical && cell.x === ship.x && cell.y >= ship.y && cell.y < ship.y + ship.size)
           || (ship.orientation === ShipOrientation.Horizontal && cell.y === ship.y && cell.x >= ship.x && cell.x < ship.x + ship.size))) {
        resultShip = ship;
      }
    }
    return resultShip;
  }

  private checkDamagedShip(cell: Cell) {
    let damagedShip: Ship = this.getShipByCell(cell);
    console.log(damagedShip);
    if (damagedShip !== null) {
      // check if the given ship is all hit
      let isAllDamaged: boolean = true;
      for (let i = 0; i < damagedShip.size; i++) {
        if (isAllDamaged && this.board[damagedShip.orientation === ShipOrientation.Vertical? damagedShip.y + i : damagedShip.y][damagedShip.orientation === ShipOrientation.Horizontal? damagedShip.x + i : damagedShip.x].state !== CellState.Hit) {
          isAllDamaged = false;
        }
      }
      if (isAllDamaged) {
        damagedShip.state = ShipState.Destroyed;   // ship is destroyed
      } else {
        damagedShip.state = ShipState.Damaged;
      }
    }
  }
}
