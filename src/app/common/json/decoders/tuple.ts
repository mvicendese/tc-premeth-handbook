/* tslint:disable:max-line-length */

import {leaveContext, parseError, withContext} from '../context';
import {Decoder} from '../types';

function tuple<T1>(d1: Decoder<T1>): Decoder<[T1]>;
function tuple<T1, T2>(d1: Decoder<T1>, d2: Decoder<T2>): Decoder<[T1, T2]>;
function tuple<T1, T2, T3>(d1: Decoder<T1>, d2: Decoder<T2>, d3: Decoder<T3>): Decoder<[T1, T2, T3]>;
function tuple<T1, T2, T3, T4>(d1: Decoder<T1>, d2: Decoder<T2>, d3: Decoder<T3>, d4: Decoder<T4>): Decoder<[T1, T2, T3, T4]>;
function tuple<T1, T2, T3, T4, T5>(d1: Decoder<T1>, d2: Decoder<T2>, d3: Decoder<T3>, d4: Decoder<T4>, d5: Decoder<T5>): Decoder<[T1, T2, T3, T4, T5]>;

function tuple<TS extends ((obj: unknown) => any)[]>(...ds: TS): Decoder<TS> {
  return (obj) => {
    if (!Array.isArray(obj)) {
      throw parseError(`Expected a json array`);
    }
    if (obj.length < ds.length) {
      throw new Error(`Expected a json array of length ${ds.length}`);
    }
    const result = obj.map((item, index) => {
      if (index >= ds.length) {
        throw parseError(`No decoder for tuple item at index ${index}`);
      }
      const decoder = ds[index];
      return withContext(`[${index}]`, () => decoder(obj[index]));
    }) as TS;
    leaveContext();
    return result;
  };
}

export default tuple;
