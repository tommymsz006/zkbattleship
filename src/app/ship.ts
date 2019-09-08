export enum ShipState {
	Undeployed = 1,
	Deployed,
	Damaged,
	Destroyed
}

export enum ShipOrientation {
	Vertical = 0,
	Horizontal
}

export class Ship {
	x: number;
	y: number;
	readonly size: number;
	orientation: ShipOrientation;
	state: ShipState;

	constructor(size: number) {
		this.size = size;
		this.state = ShipState.Undeployed;
		this.orientation = ShipOrientation.Horizontal;	// default
	}

	rotate() {
		this.orientation = (this.orientation === ShipOrientation.Horizontal)? ShipOrientation.Vertical : ShipOrientation.Horizontal;
	}

	deploy(x: number, y: number) {
		this.x = x;
		this.y = y;
		this.state = ShipState.Deployed;
	}
}

export class Carrier extends Ship {
	
	constructor() {
		super(5);
	}
}

export class Battleship extends Ship {
	
	constructor() {
		super(4);
	}
}

export class Cruiser extends Ship {
	
	constructor() {
		super(3);
	}
}

export class Submarine extends Ship {
	
	constructor() {
		super(3);
	}
}

export class Destroyer extends Ship {
	
	constructor() {
		super(2);
	}
}