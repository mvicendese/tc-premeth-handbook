import {leaveContext, parseError, withContext} from '../context';
import {Decoder, isJsonArray} from '../types';

function array<T>(decodeItem: (arr: unknown) => T): Decoder<T[]>;
function array<T>(decodeItem: (arr: unknown) => T, obj: unknown): T[];

function array<T>(decodeItem: (arr: unknown) => T, obj?: unknown): T[] | Decoder<T[]> {
  if (arguments.length > 1) {
    if (!isJsonArray(obj)) {
      throw parseError(`Expected an array`);
    }
    const result = obj.map((item, index) => withContext(`[${index}]`, () => decodeItem(item)));
    leaveContext();
    return result;
  }
  return (o: unknown) => array(decodeItem, o);
}

export default array;
