import {parse as parseDate} from 'date-fns';

import {Assessment, LessonResult, LessonResultParams} from './lesson-result';
import {Model, ModelParams} from '../model-base/model';
import {ModelRef} from '../model-base/model-ref';
import {Unit} from './unit';
import {UnitBlock} from './unit-block';
import {Student} from './student';

export interface UnitBlockResultParams extends ModelParams {
  readonly type: 'unit-block-result';

  readonly unit: ModelRef<Unit>;
  readonly block: ModelRef<UnitBlock>;
  readonly student: ModelRef<Student>;

  readonly attemptNumber: number;
  readonly date: Date | string;

  readonly mark: number;
  readonly markPercent: number;

  readonly comments: string[];

  /**
   * Breakdown of the mark according to the contribution from
   * various outcomes.
   */
  readonly assessmentBreakdown: {
    [outcomeId: string]: Assessment;
  };

  readonly lessonResults: LessonResultParams[];
}

export class StudentBlockTestResult extends Model implements UnitBlockResultParams {
  readonly type = 'unit-block-result';

  readonly unit: ModelRef<Unit>;
  readonly block: ModelRef<UnitBlock>;
  readonly student: ModelRef<Student>;

  readonly attemptNumber: number;
  readonly comments: string[];
  readonly date: Date;
  readonly mark: number;
  readonly markPercent: number;

  readonly assessmentBreakdown: Readonly<{
    [outcomeId: string]: Assessment
  }>;

  readonly lessonResults: LessonResult[];

  constructor(params: UnitBlockResultParams) {
    super(params);

    this.unit = params.unit;
    this.block = params.block;
    this.student = params.student;

    this.attemptNumber = params.attemptNumber;
    this.date = typeof params.date === 'string'
              ? parseDate(params.date, 'yyyy-mm-dd', new Date())
              : params.date;

    this.comments = params.comments;
    this.mark = params.mark;
    this.markPercent = params.markPercent;

    this.assessmentBreakdown = params.assessmentBreakdown;
    this.lessonResults = params.lessonResults.map(resultParams => new LessonResult(resultParams));
  }

}
