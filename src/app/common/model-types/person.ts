import {ModelParams} from '../model-base/model';


export interface PersonParams extends ModelParams {
  readonly firstName: string;
  readonly surname: string;
  readonly email: string;
}
