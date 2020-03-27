import {Model, ModelParams} from '../model-base/model';
import {Injectable} from '@angular/core';
import {ModelService, ModelServiceBackend} from '../model-base/model-service';


export interface TeacherParams extends ModelParams {
  readonly type: 'teacher';
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export class Teacher extends Model implements TeacherParams {
  readonly type = 'teacher';

  readonly email: string;
  readonly name: string;

  constructor(params: TeacherParams) {
    super(params);

    this.email = params.email;
    this.name = params.name;
  }
}
