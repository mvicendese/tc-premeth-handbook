import {Decoder, JsonObject} from '../types';

function nullable<T>(decode: Decoder<T>): Decoder<T | null>;
function nullable<T>(decoder: Decoder<T>, json: unknown): T;

function nullable<T>(decode: Decoder<T>, json?: unknown): Decoder<T | null> | T | null {
  const decoder = (obj: unknown) => {
    if (obj == null) {
      return null;
    }
    return decode(obj);
  };

  switch (arguments.length) {
    case 1:
      return decoder;
    case 2:
      return decoder(json);
    default:
      throw new Error(`Expected at most 2 arguments`);
  }
}

export default nullable;
