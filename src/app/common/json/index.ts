import array from './decoders/array';
import number from './decoders/number';
import bool from './decoders/bool';
import nullable from './decoders/nullable';
import object from './decoders/object';
import string from './decoders/string';
import tuple from './decoders/tuple';
import date from './decoders/date';

export default {
  array,
  bool,
  date,
  nullable,
  number,
  object,
  string,
  tuple
};

export * from './types';
export * from './context';
