export const RIR_OPTIONS = ['0', '1', '2', '3', '4+']

export function parseRir(value: string): number {
  return value === '4+' ? 4 : Number(value)
}
