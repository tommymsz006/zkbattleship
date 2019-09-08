/// <reference lib="webworker" />

import { generateProof } from './snark-helper';

addEventListener('message', ({ data }) => {
  postMessage(generateProof(data));
});
