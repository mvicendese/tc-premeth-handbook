import {leaveContext, parseError, withContext} from '../context';
import {Decoder, isJsonArray} from '../types';

export default function array<T>(decodeItem: (arr: unknown) => T): Decoder<T[]> {
  return (obj: unknown) => {
    if (!isJsonArray(obj)) {
      throw parseError(`Expected an array`);
    }
    const result = obj.map((item, index) => withContext(`[${index}]`, () => decodeItem(item)));
    leaveContext();
    return result;
  };
}
