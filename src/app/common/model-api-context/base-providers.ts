import {Provider} from '@angular/core';
import {API_BASE_HREF} from '../model-api/api-backend';

export function modelBaseProviders(apiBaseHref: string): Provider[] {
  return [
    {
      provide: API_BASE_HREF,
      useValue: apiBaseHref
    }
  ];
}
