import {Model, ModelParams} from '../model-base/model';
import {getModelRefId, ModelRef} from '../model-base/model-ref';
import {Subject} from './subject';
import {StudentUnitTestResult, UnitResultParams} from './student-unit-test-result';
import {Student} from './student';
import {Unit} from './unit';


export interface SubjectResultParams extends ModelParams {
  readonly type: 'subject-result';
  readonly subject: ModelRef<Subject>;
  readonly student: ModelRef<Student>;

  readonly units: {[unitId: string]: UnitResultParams};
}

export class SubjectResult extends Model implements SubjectResultParams {
  readonly type = 'subject-result';

  readonly subject: ModelRef<Subject>;
  readonly student: ModelRef<Student>;

  readonly units: {[unitId: string]: StudentUnitTestResult};

  constructor(params: SubjectResultParams) {
    super(params);

    this.subject = params.subject;
    this.student = params.student;

    this.units = {};
    Object.entries(params.units).forEach(([unitId, unitResultParams]) => {
      this.units[unitId] = new StudentUnitTestResult(unitResultParams);
    });
  }
}
