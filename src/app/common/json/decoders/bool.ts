import {Decoder} from '../types';
import {leaveContext, parseError} from '../context';


export default function bool(obj: unknown): boolean {
  if (typeof obj !== 'boolean') {
    throw parseError(`Expected a boolean`);
  }
  leaveContext();
  return obj;
}
