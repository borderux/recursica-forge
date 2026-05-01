import { describe, it } from 'vitest';
import { exportBrandJson } from './jsonExport';
import { writeFileSync } from 'fs';
import { getVarsStore } from '../store/varsStore';
import brandJson from '../../../../recursica_brand.json';

describe('dump brand', () => {
  it('dumps', () => {
    // initialize store with factory
    getVarsStore().bulkImport({ brand: brandJson as any });
    
    // now export
    const exported = exportBrandJson();
    
    writeFileSync('dump_brand.json', JSON.stringify(exported, null, 2));
  });
});
