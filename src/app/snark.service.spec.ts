import { TestBed } from '@angular/core/testing';

import { SnarkService } from './snark.service';

describe('SnarkService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SnarkService = TestBed.get(SnarkService);
    expect(service).toBeTruthy();
  });
});
