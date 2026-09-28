export function formatIntegerInput(input: string): string {
  const digits = input.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseIntegerInput(input: string): number | undefined {
  const digits = input.replace(/\D/g, '');
  return digits ? Number(digits) : undefined;
}
