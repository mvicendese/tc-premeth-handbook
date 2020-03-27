import {Subject} from './subject';
import {ModelRef} from '../model-base/model-ref';
import {Unit} from './unit';
import {UnitBlock} from './unit-block';
import {Model, ModelParams} from '../model-base/model';


export interface UnitBlockResultAggregates {
  year: number;
  readonly subject: ModelRef<Subject>;
  readonly unit: ModelRef<Unit>;
  readonly block: ModelRef<UnitBlock>;

  /**
   * The average test result for all students
   */
  averageTestResult: number;
  classAverageTestResult: {[classId: string]: number};

}


export interface UnitTestResultAggregateParams extends ModelParams {
  readonly type: 'unit-result-aggregate';
  readonly subject: ModelRef<Subject>;
  readonly year: number;
  readonly unit: ModelRef<Unit>;

  readonly blockAggregates: {[blockId: string]: UnitBlockResultAggregates | undefined };

  /**
   * The average student result across all students who took the unit test.
   */
  readonly averageTestResult: number;
  readonly classAverageTestResults: {[classId: string]: number};
}

export class UnitTestResultAggregate extends Model implements UnitTestResultAggregateParams {
  readonly type: 'unit-result-aggregate';

  readonly subject: ModelRef<Subject>;
  readonly unit: ModelRef<Unit>;
  readonly year: number;

  blockAggregates: { [p: string]: UnitBlockResultAggregates | undefined };

  averageTestResult: number;
  classAverageTestResults: { [p: string]: number };

  constructor(params: UnitTestResultAggregateParams) {
    super(params);

    this.subject = params.subject;
    this.unit = params.unit;
    this.year = params.year;

    this.averageTestResult = params.averageTestResult;
    this.classAverageTestResults = params.classAverageTestResults;
  }

}
