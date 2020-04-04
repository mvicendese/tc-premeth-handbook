import {leaveContext, parseError} from '../context';

export default function number(obj: unknown): number {
  if (typeof obj !== 'number') {
    throw parseError(`Expected a number`);
  }
  leaveContext();
  return obj;
}
