import {
  Model,
  ModelParams,
} from '../model-base/model';
import {Teacher, TeacherParams} from './teacher';
import {Student, StudentParams} from './student';
import {Subject} from './subject';
import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';
import {isModelRefId, ModelRef, unresolvedModelRefError} from '../model-base/model-ref';
import {ModelService, ModelServiceBackend} from '../model-base/model-service';
import {ResponsePage} from '../model-base/pagination';
import {Injectable} from '@angular/core';


export interface SubjectClassParams extends ModelParams {
  readonly type: 'class'
  readonly subject: ModelRef<Subject>;

  readonly year: number;
  readonly teacher: ModelRef<Teacher>;
  readonly subgroup: string;
  readonly classCode: string;

  readonly students: StudentParams[];
}

export class SubjectClass extends Model implements SubjectClassParams {
  readonly type = 'class';

  subject: ModelRef<Subject>;
  teacher: ModelRef<Teacher>;
  year: number;
  readonly subgroup: string;
  readonly classCode: string;

  readonly students: Student[];

  constructor(params: SubjectClassParams) {
    super(params);

    this.subject = params.subject;
    this.teacher = params.teacher;
    this.year = params.year;
    this.subgroup = params.subgroup;
    this.classCode  = params.classCode;

    this.students = params.students.map(studentParams => new Student(studentParams));
  }

}
