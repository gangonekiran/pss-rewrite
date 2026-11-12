/** Shared input / select styling for the input forms. */
export const inputClass =
  'h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-100';

export const selectClass = inputClass;

/** Radio button inside an option card. */
export const radioClass = 'mt-0.5 h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500';

/** Bordered card around a radio button and its label; turns green when chosen. */
export const optionClass =
  'flex cursor-pointer items-start gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 has-[:checked]:border-green-600 has-[:checked]:bg-green-50';
