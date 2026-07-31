export const isNullOrEmpty = (value?: string | null): boolean =>
  !value || value.trim().length === 0;

export const capitalize = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);
