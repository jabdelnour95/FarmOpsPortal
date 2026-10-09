import test from 'node:test';
import assert from 'node:assert/strict';

import { filterAndSortCrops, normalizeCropUpdate } from '../js/modules/crop-catalog.mjs';

test('normalizes the editable crop fields for the API', () => {
  assert.deepEqual(normalizeCropUpdate({
    name: '  Tomate cherry ',
    harvestUnit: ' kg ',
    internalPrice: '1250.5',
    active: true,
  }), {
    name: 'Tomate cherry',
    harvest_unit: 'kg',
    internal_price: 1250.5,
    active: true,
  });
});

test('rejects missing fields and invalid prices', () => {
  assert.throws(
    () => normalizeCropUpdate({ name: '', harvestUnit: 'kg', internalPrice: '1', active: true }),
    /nombre/,
  );
  assert.throws(
    () => normalizeCropUpdate({ name: 'Tomate', harvestUnit: '', internalPrice: '1', active: true }),
    /unidad/,
  );
  assert.throws(
    () => normalizeCropUpdate({ name: 'Tomate', harvestUnit: 'kg', internalPrice: '-1', active: true }),
    /igual o mayor que cero/,
  );
});

test('filters crops without accents or case and sorts them by name', () => {
  const crops = [
    { id: '2', name: 'Zanahoria' },
    { id: '1', name: 'Café' },
    { id: '3', name: 'Cacao' },
  ];

  assert.deepEqual(filterAndSortCrops(crops).map(crop => crop.id), ['3', '1', '2']);
  assert.deepEqual(filterAndSortCrops(crops, 'CAFE').map(crop => crop.id), ['1']);
});
