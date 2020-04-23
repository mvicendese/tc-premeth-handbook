import {leaveContext, parseError} from '../context';

export default function number(obj: unknown): number {
  if (typeof obj === 'string') {
    const maybeNumber = Number.parseFloat(obj);
    if (Number.isNaN(maybeNumber)) {
      throw parseError(`Expected a number`)
    }
    leaveContext();
    return maybeNumber;
  } else if (typeof obj === 'number') {
    leaveContext();
    return obj;
  }
  throw parseError(`Expected a number`);
}
