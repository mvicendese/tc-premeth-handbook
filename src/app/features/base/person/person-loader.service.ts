import {OrderedMap} from 'immutable';

import {Inject, Injectable, InjectionToken, Provider, Type} from '@angular/core';
import {ModelLoader} from '../../../common/model-api-context/model-loader';
import {Person} from './person.model';

export type PersonTypeLoader = [string, ModelLoader<any>];
export const PERSON_TYPE_LOADER = new InjectionToken('PERSON_TYPE_LOADER');

export function providePersonTypeLoader<T extends Person, Loader extends ModelLoader<T> = ModelLoader<T>>(
  type: T['type'],
  loader: Type<Loader> | InjectionToken<Loader>): Provider {
  return {
    provide: PERSON_TYPE_LOADER,
    useExisting: loader,
    multi: true
  };
}

@Injectable()
export class PersonLoaderService {
  readonly typeLoaderMap = OrderedMap(this.typeLoaders);

  constructor(
    @Inject(PERSON_TYPE_LOADER)
    readonly typeLoaders: PersonTypeLoader[]
  ) {}

  modelLoader<T extends Person>(type: T['type']): ModelLoader<T> {
    const v = this.typeLoaderMap.get(type);
    if (!v) {
      throw new Error(`No model loader provided for ${type}`);
    }
    return v;
  }
}
