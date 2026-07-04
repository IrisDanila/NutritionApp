export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export const round = (v: number, dp = 0) => {
  const f = 10 ** dp;
  return Math.round(v * f) / f;
};

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export const kgToLb = (kg: number) => kg * 2.2046226218;
export const lbToKg = (lb: number) => lb / 2.2046226218;
export const cmToInch = (cm: number) => cm / 2.54;
export const inchToCm = (inch: number) => inch * 2.54;
export const mlToOz = (ml: number) => ml / 29.5735;
export const ozToMl = (oz: number) => oz * 29.5735;
