import {Decoder, JsonObject} from './json';
import {BehaviorSubject, Observable, Observer, of, Subscription} from 'rxjs';
import {ErrorHandler, Inject, Injectable} from '@angular/core';
import {DOCUMENT} from '@angular/common';



@Injectable({providedIn: 'root'})
export class LocalStorageService {

  constructor(
    @Inject(DOCUMENT)
    readonly document: Document
  ) {}

  protected get windowLocalStorage(): Storage {
    const defaultView = this.document.defaultView;
    if (defaultView == null) {
      throw new Error('Local storage must be accessed from a browser environment.');
    }
    return defaultView.localStorage;
  }

  storedValue<T>(key: string, decode?: Decoder<T>, encode?: (value) => any): StoredValue<T> {
    decode = decode || ((obj: unknown) => obj as T);
    encode = encode || ((value) => value as T);
    return new StoredValue(this, key, decode, encode);

  }

  getItem<T>(key: string, decode: Decoder<T>) {
    const value = this.windowLocalStorage.getItem(key);
    return decode(value && JSON.parse(value));
  }

  setItem<T>(key: string, encode: (obj: T) => unknown, value: T) {
    if (value == null) {
      this.windowLocalStorage.removeItem(key);
    } else {
      this.windowLocalStorage.setItem(key, JSON.stringify(encode(value)));
    }
  }
}

export class StoredValue<T> extends BehaviorSubject<T> {
  constructor(
    readonly localStorage: LocalStorageService,
    readonly key: string,
    readonly decode: (obj: unknown) => T,
    readonly encode: (value: T) => unknown
  ) {
    super(localStorage.getItem(key, decode));
  }

  next(value: T) {
    this.localStorage.setItem(this.key, this.encode, value);
    super.next(value);
  }
}
