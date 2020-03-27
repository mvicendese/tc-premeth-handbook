import {Provider} from '@angular/core';
import {API_BASE_HREF, ModelServiceBackend} from './model-service';


export function modelBaseProviders(apiBaseHref: string): Provider[] {
  return [
    {
      provide: API_BASE_HREF,
      useValue: apiBaseHref
    },
    ModelServiceBackend
  ];
}
