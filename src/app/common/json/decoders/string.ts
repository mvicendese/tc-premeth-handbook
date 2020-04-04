import {leaveContext, parseError} from '../context';


export default function string(obj: unknown): string {
  if (typeof obj !== 'string') {
    throw parseError(`Expected a string`);
  }
  leaveContext();
  return obj;
}
