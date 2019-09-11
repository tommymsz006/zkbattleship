import { InjectionToken } from '@angular/core';
import Web3 from 'web3';

export const WEB3_TOKEN = new InjectionToken<Web3>('web3', {
  providedIn: 'root',
  factory: () => {
    try {
      const provider = ('ethereum' in window) ? window['ethereum'] : Web3.givenProvider;
      // IMPORTANT: need to enable (user to allow account access) due to MetaMask upgrade on 2nd Nov 2018 (EIP-1102)
      if ('ethereum' in window) {
        provider.enable();
  	  }
      return new Web3(provider);
    } catch (err) {
      throw new Error('Non-Ethereum browser detected. You should consider trying Mist or MetaMask!');
    }
  }
});
