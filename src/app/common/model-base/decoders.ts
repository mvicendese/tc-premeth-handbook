import {parseISO as parseISODate} from 'date-fns';

export function parseDateParam(rawDate: string | Date): Date;
export function parseDateParam(rawDate: string | Date | null): Date | null;
export function parseDateParam(rawDate: string | Date | null) {
  if (rawDate == null) {
    return null;
  } else if (typeof rawDate === 'string') {
    return parseISODate(rawDate);
  } else {
    return rawDate;
  }
}
