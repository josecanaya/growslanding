/** Colores por fase (etapa) en diagrama Obra completa — solo UI. */
export type FaseColorStyle = {
  key: string;
  border: string;
  bg: string;
  bar: string;
  text: string;
};

const PALETTE: Omit<FaseColorStyle, 'key'>[] = [
  { border: '#2563eb', bg: '#eff6ff', bar: '#2563eb', text: '#1e40af' },
  { border: '#7c3aed', bg: '#f5f3ff', bar: '#7c3aed', text: '#5b21b6' },
  { border: '#c026d3', bg: '#fdf4ff', bar: '#c026d3', text: '#86198f' },
  { border: '#ea580c', bg: '#fff7ed', bar: '#ea580c', text: '#9a3412' },
  { border: '#059669', bg: '#ecfdf5', bar: '#059669', text: '#047857' },
  { border: '#0891b2', bg: '#ecfeff', bar: '#0891b2', text: '#0e7490' },
  { border: '#ca8a04', bg: '#fefce8', bar: '#ca8a04', text: '#a16207' },
  { border: '#dc2626', bg: '#fef2f2', bar: '#dc2626', text: '#b91c1c' },
  { border: '#4f46e5', bg: '#eef2ff', bar: '#4f46e5', text: '#4338ca' },
  { border: '#0d9488', bg: '#f0fdfa', bar: '#0d9488', text: '#0f766e' },
];

export function buildFaseColorMap(faseNamesInOrder: string[]): Map<string, FaseColorStyle> {
  const map = new Map<string, FaseColorStyle>();
  const unique = [...new Set(faseNamesInOrder.map((n) => n.trim() || 'Obra'))];
  unique.forEach((name, i) => {
    const p = PALETTE[i % PALETTE.length]!;
    map.set(name, { key: name, ...p });
  });
  return map;
}
