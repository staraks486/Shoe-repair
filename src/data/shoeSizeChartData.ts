export interface SizeRow {
  cm: number;
  euro: number;
  us: number;
  ukIndian: number;
}

export interface SizeCategoryData {
  category: 'MEN' | 'WOMEN' | 'KIDS';
  label: string;
  description: string;
  sizes: SizeRow[];
}

export const MEN_SIZE_CHART: SizeRow[] = [
  { cm: 24.0, euro: 38, us: 5, ukIndian: 4 },
  { cm: 24.7, euro: 39, us: 6, ukIndian: 5 },
  { cm: 25.3, euro: 40, us: 7, ukIndian: 6 },
  { cm: 26.0, euro: 41, us: 8, ukIndian: 7 },
  { cm: 26.7, euro: 42, us: 9, ukIndian: 8 },
  { cm: 27.3, euro: 43, us: 10, ukIndian: 9 },
  { cm: 28.0, euro: 44, us: 11, ukIndian: 10 },
  { cm: 28.7, euro: 45, us: 12, ukIndian: 11 },
  { cm: 29.3, euro: 46, us: 13, ukIndian: 12 },
];

export const WOMEN_SIZE_CHART: SizeRow[] = [
  { cm: 22.0, euro: 35, us: 4, ukIndian: 2 },
  { cm: 22.7, euro: 36, us: 5, ukIndian: 3 },
  { cm: 23.3, euro: 37, us: 6, ukIndian: 4 },
  { cm: 24.0, euro: 38, us: 7, ukIndian: 5 },
  { cm: 24.7, euro: 39, us: 8, ukIndian: 6 },
  { cm: 25.3, euro: 40, us: 9, ukIndian: 7 },
  { cm: 26.0, euro: 41, us: 10, ukIndian: 8 },
  { cm: 26.7, euro: 42, us: 11, ukIndian: 9 },
  { cm: 27.3, euro: 43, us: 12, ukIndian: 10 },
];

export const KIDS_SIZE_CHART: SizeRow[] = [
  { cm: 14.0, euro: 23, us: 6, ukIndian: 5 },
  { cm: 14.7, euro: 24, us: 7, ukIndian: 6 },
  { cm: 15.3, euro: 25, us: 8, ukIndian: 7 },
  { cm: 16.0, euro: 26, us: 9, ukIndian: 8 },
  { cm: 16.7, euro: 27, us: 10, ukIndian: 9 },
  { cm: 17.3, euro: 28, us: 11, ukIndian: 10 },
  { cm: 18.0, euro: 29, us: 12, ukIndian: 11 },
  { cm: 18.7, euro: 30, us: 13, ukIndian: 12 },
  { cm: 19.3, euro: 31, us: 1, ukIndian: 13 },
  { cm: 20.0, euro: 32, us: 2, ukIndian: 1 },
  { cm: 20.7, euro: 33, us: 3, ukIndian: 2 },
  { cm: 21.3, euro: 34, us: 4, ukIndian: 3 },
];

export interface FootwearSymbol {
  name: string;
  type: 'Material' | 'Part';
  description: string;
  svgType: 'hide' | 'coatedHide' | 'textile' | 'diamond' | 'lining' | 'upper' | 'sole';
}

export const FOOTWEAR_SYMBOLS: FootwearSymbol[] = [
  {
    name: 'Leather',
    type: 'Material',
    description: 'Natural genuine animal hide / leather upper or lining',
    svgType: 'hide',
  },
  {
    name: 'Coated Leather',
    type: 'Material',
    description: 'Leather with a protective polyurethane or synthetic surface coating',
    svgType: 'coatedHide',
  },
  {
    name: 'Textile',
    type: 'Material',
    description: 'Woven or knitted fabric canvas, mesh, or lining material',
    svgType: 'textile',
  },
  {
    name: 'Other Materials',
    type: 'Material',
    description: 'Synthetic polymers, rubber, thermoplastic, or compound materials',
    svgType: 'diamond',
  },
  {
    name: 'Lining',
    type: 'Part',
    description: 'Interior lining and insole covering that touches the foot',
    svgType: 'lining',
  },
  {
    name: 'Upper',
    type: 'Part',
    description: 'Outer top covering of the shoe (vamp, quarters, and tongue)',
    svgType: 'upper',
  },
  {
    name: 'Sole',
    type: 'Part',
    description: 'Outer bottom sole (outsole) that makes contact with the ground',
    svgType: 'sole',
  },
];

export const SHOE_SIZE_ALL_DATA: SizeCategoryData[] = [
  {
    category: 'MEN',
    label: "Men's Sizes",
    description: 'Standard Indian / UK Men sizing reference (24.0 cm to 29.3 cm)',
    sizes: MEN_SIZE_CHART,
  },
  {
    category: 'WOMEN',
    label: "Women's Sizes",
    description: 'Standard Indian / UK Women sizing reference (22.0 cm to 27.3 cm)',
    sizes: WOMEN_SIZE_CHART,
  },
  {
    category: 'KIDS',
    label: "Kids' Sizes",
    description: 'Standard Indian / UK Children sizing reference (14.0 cm to 21.3 cm)',
    sizes: KIDS_SIZE_CHART,
  },
];
