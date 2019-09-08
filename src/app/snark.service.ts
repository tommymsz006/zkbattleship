import { Injectable } from '@angular/core';

import { Observable, fromEvent } from "rxjs";
import { map, tap } from 'rxjs/operators';

import { hash, generateProof, verifyProof } from './snark-helper';

import { Ship, Carrier, Battleship, Cruiser, Submarine, Destroyer } from './ship';

// load local json files
// prover
import circuitDefinition from '../assets/circuit.json';
import provingKey from '../assets/snark/proving_key_groth.json';

// verifier
import verificationKey from '../assets/snark/verification_key_groth.json';


@Injectable({
  providedIn: 'root'
})
export class SnarkService {
  private _shipHash;
  private _proveWorker: Worker;
  private _verifyWorker: Worker;
  proofOutput$;
  isValid$;
  input: {  carrierX: number; carrierY: number; carrierO: number;
            battleshipX: number; battleshipY: number; battleshipO: number;
            cruiserX: number; cruiserY: number; cruiserO: number;
            submarineX: number; submarineY: number; submarineO: number;
            destroyerX: number; destroyerY: number; destroyerO: number;
            shipHash?: string[]; targetX?: number; targetY?: number};

  constructor() {
    if (typeof Worker !== 'undefined') {
      // prove worker
      this._proveWorker = new Worker('./snark-prove.worker', { type: 'module' });
      this.proofOutput$ = fromEvent<MessageEvent>(this._proveWorker, 'message')
                            .pipe(
                              tap(e => {
                                console.log(e.data.proof);
                                console.log(e.data.publicSignals);
                                // TODO: consumer should call for verification instead of self-initiate
                                //this._verifyByWorker(e.data.proof, e.data.publicSignals);
                              }),
                              map(e => {
                                return {fireResult: e.data.publicSignals[0],
                                        proof: e.data.proof,
                                        targetX: e.data.publicSignals[3],
                                        targetY: e.data.publicSignals[4]};
                              })
                            );

      // verify worker
      this._verifyWorker = new Worker('./snark-verify.worker', { type: 'module' });
      this.isValid$ = fromEvent<MessageEvent>(this._verifyWorker, 'message')
                        .pipe(
                          tap(e => {
                            console.log(e.data.publicSignals);
                            console.log(e.data.isValid);
                          }),
                          map(e => {
                            return {isValid: e.data.isValid,
                                    targetX: e.data.publicSignals[3],
                                    targetY: e.data.publicSignals[4]};
                          })
                        );
    } else {
      // Web Workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
    }
  }

  commitShips(ships: Ship[]) {
    let carrier: Carrier;
    let battleship: Battleship;
    let crusier: Cruiser;
    let submarine: Submarine;
    let destroyer: Destroyer;

    // TODO: should replace Ship[] to confined collection of 5 types of ships
    for (let i = 0; i < ships.length; i++) {
      if (ships[i] instanceof Carrier)
        carrier = ships[i];
      else if (ships[i] instanceof Battleship)
        battleship = ships[i];
      else if (ships[i] instanceof Cruiser)
        crusier = ships[i];
      else if (ships[i] instanceof Submarine)
        submarine = ships[i];
      else if (ships[i] instanceof Destroyer)
        destroyer = ships[i];
    }
    this._commitShips(carrier, battleship, crusier, submarine, destroyer);
  }

  private _commitShips (carrier: Carrier, battleship: Battleship, crusier: Cruiser, submarine: Submarine, destroyer: Destroyer) {
    this.input = {  carrierX: carrier.x, carrierY: carrier.y, carrierO: carrier.orientation,
                    battleshipX: battleship.x, battleshipY: battleship.y, battleshipO: battleship.orientation,
                    cruiserX: crusier.x, cruiserY: crusier.y, cruiserO: crusier.orientation,
                    submarineX: submarine.x, submarineY: submarine.y, submarineO: submarine.orientation,
                    destroyerX: destroyer.x, destroyerY: destroyer.y, destroyerO: destroyer.orientation
                 };

    // generate ship hash
    this._shipHash = hash(this.input);
    console.log(this._shipHash);
  }

  fire(targetX: number, targetY: number) {
    //this.proveSync(targetX, targetY);
    this._proveByWorker(targetX, targetY);
  }

  verify(proof, hitOrMissed: number, targetX: number, targetY: number) {
    this._verifyByWorker(proof, [hitOrMissed, this._shipHash[0], this._shipHash[1], targetX, targetY]);
  }

  private _constructInput(targetX: number, targetY: number) {
    const allInputs = JSON.parse(JSON.stringify(this.input)); // clone of this.input, including private and hash
    allInputs.targetX = targetX;
    allInputs.targetY = targetY;
    allInputs.shipHash = this._shipHash;
    return allInputs;
  }

  private _proveSync(targetX: number, targetY: number) {
    const output = generateProof({  allInput: this._constructInput(targetX, targetY),
                                    circuit: circuitDefinition,
                                    provingKey: provingKey});
    //this.proof = output.proof;
    //this.publicSignals = output.publicSignals;
    console.log(output.proof);
    console.log(output.publicSignals);
    return output;
  }

  private _proveByWorker(targetX: number, targetY: number) {
    this._proveWorker.postMessage({  allInput: this._constructInput(targetX, targetY),
                                    circuit: circuitDefinition,
                                    provingKey: provingKey});
  }

  private _verifySync(proof, publicSignals) {
    console.log(
      verifyProof({ verificationKey: verificationKey,
                    proof: proof,
                    publicSignals: publicSignals})
    );
  }

  private _verifyByWorker(proof, publicSignals) {
    console.log(publicSignals);
    this._verifyWorker.postMessage({  verificationKey: verificationKey,
                                     proof: proof,
                                     publicSignals: publicSignals});
  }
}