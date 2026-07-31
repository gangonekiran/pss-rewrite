import dayjs from 'dayjs';

export const formatDate = (value: string | Date, format = 'DD/MM/YYYY') =>
  dayjs(value).format(format);
