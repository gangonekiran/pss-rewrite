export const isEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isPhone = (phone: string): boolean =>
  /^\d{10}$/.test(phone);
