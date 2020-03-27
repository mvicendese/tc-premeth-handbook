import {Model, ModelParams} from '../model-base/model';
import {Injectable} from '@angular/core';
import {Subject} from './subject';
import {Observable} from 'rxjs';
import {ModelService, ModelServiceBackend} from '../model-base/model-service';
import {ResponsePage} from '../model-base/pagination';


export interface StudentParams extends ModelParams {
  readonly type: 'student';
  readonly code: string;
  readonly firstName: string;
  readonly surname: string;

  readonly yearLevel: number;
  readonly compassNumber: number;
}

export class Student extends Model implements StudentParams {
  readonly type = 'student';

  readonly firstName: string;
  readonly yearLevel: number;
  readonly code: string;

  readonly surname: string;
  readonly compassNumber: number;

  constructor(params: StudentParams) {
    super(params);
    this.code = params.code;
    this.firstName = params.firstName;
    this.surname = params.surname;
    this.yearLevel = params.yearLevel;
    this.compassNumber = params.compassNumber;
  }

  get group(): 'junior' | 'senior' {
    return this.yearLevel <= 9 ? 'junior' : 'senior';
  }

  get fullName() {
    return [this.firstName, this.surname].join(' ');
  }

  get email() {
    return `${this.code}@tc.vic.edu.au`;
  }

  get compassLink() {
    return `https://tc-vic.compass.education/Records/User.aspx?userId=${this.compassNumber}`;
  }
}

