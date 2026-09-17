import test from 'node:test';
import assert from 'node:assert/strict';

import { plantingPrimaryBedEmbed } from '../worker/planting-selects.mjs';

test('selects a planting primary bed through its explicit FK', () => {
  assert.equal(
    plantingPrimaryBedEmbed('code', 'area_id', 'subarea_id'),
    'beds!plantings_bed_id_fkey(code,area_id,subarea_id)',
  );
});
