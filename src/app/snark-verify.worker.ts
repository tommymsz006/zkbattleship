/// <reference lib="webworker" />

import { verifyProof } from './snark-helper';

addEventListener('message', ({ data }) => {
  const output = {isValid: verifyProof(data), publicSignals: data.publicSignals};
  postMessage(output);
});
