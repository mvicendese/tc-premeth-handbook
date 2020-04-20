import {Decoder} from '../types';
import {parseError} from '../context';

function union<T, K extends string = string>(select: (obj: unknown) => K, decoders: Record<K, Decoder<T>>): Decoder<T>;
function union<T, K extends string = string>(select: (obj: unknown) => K, decoders: Record<K, Decoder<T>>, obj: unknown): T;

function union<T, V extends T = T, K extends string = string>(
  select: (obj: unknown) => K,
  decoders: Record<K, Decoder<V>>,
  json?: unknown
): Decoder<T> | T {
  const decoder = (obj: unknown) => {
    const selection = select(obj);
    const decoder = decoders[selection];
    if (decoder === undefined) {
      throw parseError(`Could not select a decoder for union`);
    }
    return decoder(obj);
  };

  if (json === undefined) {
    return decoder;
  } else {
    return decoder(json);
  }
}

export default union;


