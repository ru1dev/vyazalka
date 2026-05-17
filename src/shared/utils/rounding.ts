export function roundToInteger(value: number): number {
  return Math.round(value);
}

export function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
