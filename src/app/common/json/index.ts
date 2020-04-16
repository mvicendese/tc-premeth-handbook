import array from './decoders/array';
import number from './decoders/number';
import bool from './decoders/bool';
import nullable from './decoders/nullable';
import object from './decoders/object';
import string from './decoders/string';
import tuple from './decoders/tuple';
import date from './decoders/date';
import union from './decoders/union';
import {record} from './decoders/record';

export default {
  array,
  bool,
  date,
  nullable,
  number,
  object,
  record,
  string,
  tuple,
  union
};

export * from './types';
export * from './context';
