import { Circuit, groth, bigInt, unstringifyBigInts } from 'snarkjs';
import { pedersenHash, babyJub } from 'circomlib';

export function generateProof(data) {
  // calculate witness and generate proof
  const circuit: Circuit = new Circuit(data.circuit);
  const witness = circuit.calculateWitness(data.allInput);
  //console.log(witness);
  return groth.genProof(unstringifyBigInts(data.provingKey), witness);    // Groth 16
}

export function hash(input : { carrierX: number; carrierY: number; carrierO: number;
                               battleshipX: number; battleshipY: number; battleshipO: number;
                               cruiserX: number; cruiserY: number; cruiserO: number;
                               submarineX: number; submarineY: number; submarineO: number;
                               destroyerX: number; destroyerY: number; destroyerO: number}) {
  const preImage: bigInt = bigInt(input.carrierX) + bigInt(input.carrierY * 16) + bigInt(input.carrierO * (16**2))
                           + bigInt(input.battleshipX * (16**3)) + bigInt(input.battleshipY * (16**4)) + bigInt(input.battleshipO * (16**5))
                           + bigInt(input.cruiserX * (16**6)) + bigInt(input.cruiserY * (16**7)) + bigInt(input.cruiserO * (16**8))
                           + bigInt(input.submarineX * (16**9)) + bigInt(input.submarineY * (16**10)) + bigInt(input.submarineO * (16**11))
                           + bigInt(input.destroyerX * (16**12)) + bigInt(input.destroyerY * (16**13)) + bigInt(input.destroyerO * (16**14));
  console.log(preImage);
  const buffer = bigInt.leInt2Buff(preImage, 32);
  const hash = pedersenHash.hash(buffer);
  return babyJub.unpackPoint(hash);    // results in 2 bigInt outputs
}

// function hashAndGenerateProof(data) {
//   data.allInput.shipHash = hash(data.allInput);
//   console.log(data.allInput.shipHash);
//   return generateProof(data);
// }

export function verifyProof(data) {
  let response = {isValid: false};
  response.isValid = groth.isValid(
                        unstringifyBigInts(data.verificationKey),
                        unstringifyBigInts(data.proof),
                        unstringifyBigInts(data.publicSignals));
  return response;
}