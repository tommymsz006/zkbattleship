import { Injectable, Inject } from '@angular/core';

import { Observable, fromEvent, from } from "rxjs";
import { map, tap } from 'rxjs/operators';

import { WEB3_TOKEN } from './web3-token';
import Web3 from 'web3';

import { stringifyBigInts } from 'snarkjs';
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
  // circuit
  private _shipHash;
  input: {  carrierX: number; carrierY: number; carrierO: number;
            battleshipX: number; battleshipY: number; battleshipO: number;
            cruiserX: number; cruiserY: number; cruiserO: number;
            submarineX: number; submarineY: number; submarineO: number;
            destroyerX: number; destroyerY: number; destroyerO: number;
            shipHash?: string[]; targetX?: number; targetY?: number};

  // workers
  private _proveWorker: Worker;
  private _verifyWorker: Worker;
  proofOutput$;
  isValid$;

  // web3
  private readonly _contract = new this.web3.eth.Contract(
                              [{"constant": true,
                                "inputs":
                                 [ { "name": "a", type: "uint256[2]" },
                                   { "name": "b", type: "uint256[2][2]" },
                                   { "name": "c", type: "uint256[2]" },
                                   { "name": "input", type: "uint256[5]" } ],
                                "name": "verifyProof",
                                "outputs": [ { "name": "r", "type": "bool" } ],
                                "payable": false,
                                "stateMutability": "view",
                                "type": "function"}]);    // contract address
  //isValidWeb3$;
  defaultAccount;

  constructor(@Inject(WEB3_TOKEN) private web3: Web3) {
    // workers
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
      // callback for web worker unavailability
      console.log("Web worker does not work in this environment.");
    }

    // initialize default account for web3
    if (this.web3.eth.defaultAccount === undefined) {
      this.web3.eth.getAccounts().then(accounts => {
        if (accounts !== undefined && accounts.length >= 0) {
          this.web3.eth.defaultAccount = accounts[0];
        }
      });
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

  verifyByWeb3(proof, hitOrMissed: number, targetX: number, targetY: number, contractAddress: string): Observable<any> {
    let obs$: Observable<any>;
    if (this.web3.eth.defaultAccount !== undefined) {
      let proofStr = stringifyBigInts(proof);
      let publicSignalsStr = stringifyBigInts([hitOrMissed, this._shipHash[0], this._shipHash[1], targetX, targetY]);
      
      this._contract.options.address = contractAddress;    // set contract address from input
      obs$ = from(this._contract.methods.verifyProof( //["0x1a5477f1be6e0848a56b9096129d5c0059c827754139f09b75eb2c1c048c60f7", "0x2df79a9152778ad0ae06eadf28dae4202cf36cc1ba4970a06387610e74d7c67c"],[["0x07e1cd23f31fa80719aaaf206f702314a863aca1d5759bba488947eae30ebc67", "0x0e6eeec15da9b0ee6970bf16f3daacadf5d238dd5686c3ac0517e5f715f7470f"],["0x02066e719b0e65be000c653ad1cba15b8596cf3dce1feabe4729a1558ef5fa8c", "0x22d5103edb4d4f575be7d097053efdd2cadf6ea772dcbaf99ad79f077fd63919"]],["0x0d5402a0549ba4befa91b3e164c9f2cbd9f11aadb18c8218df7a62714181ac31", "0x2c65e9e3c3539b143fc514fb4c6eb313840aae96522fb3bec7aeecb520e0b7c7"],["0x0000000000000000000000000000000000000000000000000000000000000000","0x21fbaf5e2735c43501f8de4fcedb5594545a8a7708a51da7fdc0ebd866df2278","0x2a13595b64226e5f9e0e3e47c6fc1013d9daae87e5f560467e09e467033aee05","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000000000000000000000000000000000000000000000"]
                                                      //).call({}));
                                                      [proofStr.pi_a[0], proofStr.pi_a[1]],
                                                      [[proofStr.pi_b[0][1], proofStr.pi_b[0][0]],
                                                      [proofStr.pi_b[1][1], proofStr.pi_b[1][0]]],
                                                      [proofStr.pi_c[0], proofStr.pi_c[1]],
                                                      publicSignalsStr).call({})).pipe(
                                                                    map(data => {
                                                                      return {isValid: data,
                                                                              targetX: targetX,
                                                                              targetY: targetY};
                                                                    })
                                                                  );

    }
    return obs$;
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