import {parseISO} from 'date-fns';
import {leaveContext, parseError} from '../context';

export default function date(obj: unknown): Date {
  let result: Date | undefined = undefined;
  if (typeof obj === 'string') {
    result = parseISO(obj);
  }
  if (obj instanceof Date) {
    result = obj;
  }
  if (!result) {
    throw parseError(`Expected a string or Date object`);
  }
  leaveContext();
  return result;
}
