function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
}

export function filterAndSortCrops(crops, query = '') {
  const needle = normalizeSearchText(query).trim();
  return [...(crops || [])]
    .filter(crop => !needle || normalizeSearchText(crop.name).includes(needle))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' }));
}

export function normalizeCropUpdate({ name, harvestUnit, internalPrice, active }) {
  const normalizedName = String(name ?? '').trim();
  const normalizedUnit = String(harvestUnit ?? '').trim();
  const rawPrice = String(internalPrice ?? '').trim();

  if (!normalizedName) throw new Error('Ingresá el nombre del cultivo.');
  if (!normalizedUnit) throw new Error('Ingresá la unidad de cosecha.');
  if (!rawPrice) throw new Error('Ingresá el precio por unidad.');

  const normalizedPrice = Number(rawPrice);
  if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
    throw new Error('El precio debe ser un número igual o mayor que cero.');
  }
  if (normalizedPrice > 99999999.99) {
    throw new Error('El precio ingresado es demasiado alto.');
  }

  return {
    name: normalizedName,
    harvest_unit: normalizedUnit,
    internal_price: Math.round((normalizedPrice + Number.EPSILON) * 100) / 100,
    active: Boolean(active),
  };
}
