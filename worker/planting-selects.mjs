const PRIMARY_BED_RELATION = 'plantings_bed_id_fkey';

export function plantingPrimaryBedEmbed(...columns) {
  return `beds!${PRIMARY_BED_RELATION}(${columns.join(',')})`;
}
