export type ColorId = 'salmon' | 'mint' | 'butter';

export interface ColorDef {
  tile: string;
  text: string;
  label: string;
}

export const COLORS: Record<ColorId, ColorDef> = {
  salmon: { tile: '#F4A6A0', text: '#8B3A34', label: '●' },
  mint:   { tile: '#A8D8C9', text: '#2D6B5B', label: '●' },
  butter: { tile: '#F2D58A', text: '#7A5F20', label: '●' },
};

export const COLOR_ORDER: ColorId[] = ['salmon', 'mint', 'butter'];
