import {ModelService} from './model-service';
import {Model} from './model';
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs';
import {InjectionToken, Provider, Type} from '@angular/core';

export interface ModelServiceConfig {
  /** The key in the param map to fetch */
  readonly idParam: string;
};

export class ResolveModelService<T extends Model> implements Resolve<T> {
  constructor(
    readonly service: ModelService<T>,
    readonly config: ModelServiceConfig
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<T> {
    return this.service.fetch(route.paramMap.get(this.config.idParam));
  }
}

export function modelServiceResolverFactory<T extends Model>(
  config: ModelServiceConfig
): (service: ModelService<T>) => Resolve<T> {
  return (service) => new ResolveModelService(service, config);
}

export function provideModelResolver<T extends Model, Service extends ModelService<T>>(
  token: InjectionToken<Resolve<T>>,
  service: Type<Service> | InjectionToken<Service>,
  config: ModelServiceConfig
): Provider {
  return {
    provide: token,
    useFactory: (modelService: Service) => new ResolveModelService(modelService, config),
    deps: [service]
  };
}

