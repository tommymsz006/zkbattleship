export enum CellState {
	Vacant = 1,
	Occupied,
	Missed,
	Hit
}

export enum CellValidity {
	None = 1,
	Proving,
	Verifying,
	Verified,
	Invalid
}

export class Cell {
	x: number;
	y: number;
	state: CellState;
	validity: CellValidity;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
		this.state = CellState.Vacant;
		this.validity = CellValidity.None;
	}

	occupy() {
		let isSucceed: boolean = false;
		switch(this.state) {
			case CellState.Vacant:
				this.state = CellState.Occupied;
				isSucceed = true;
				break;
		}
		return isSucceed;
	}

	fire() {
		let isSucceed: boolean = false;
		switch(this.state) {
			case CellState.Vacant:
				this.state = CellState.Missed;
				isSucceed = true;
				break;
			case CellState.Occupied:
				this.state = CellState.Hit;
				isSucceed = true;
				break;
		}
		if (isSucceed) {
			this.validity = CellValidity.Proving;
		}
		return isSucceed;
	}

	verify(hitOrMissed: CellState) {
		let isSucceed: boolean = false;
		switch(this.validity) {
			case CellValidity.Proving:
				if (hitOrMissed === this.state) {
					this.validity = CellValidity.Verifying;
					isSucceed = true;
				} else {
					this.validity = CellValidity.Invalid;
				}
				break;
		}
		return isSucceed;
	}

	validate(isValid: boolean) {
		let isSucceed: boolean = false;
		switch(this.validity) {
			case CellValidity.Verifying:
				if (isValid) {
					this.validity = CellValidity.Verified;
					isSucceed = true;
				} else {
					this.validity = CellValidity.Invalid;
				}
				break;
		}
		return isSucceed;
	}
}
