import {Model, ModelParams} from '../model-base/model';
import {Subject} from './subject';
import {Unit} from './unit';
import {UnitBlock} from './unit-block';
import {LessonSchema} from './lesson-schema';
import {ModelRef} from '../model-base/model-ref';


export interface LessonOutcomeParams extends ModelParams {
  readonly type: 'lesson-outcome';
  readonly subject: ModelRef<Subject>;
  readonly unit: ModelRef<Unit>;
  readonly block: ModelRef<UnitBlock>;
  readonly lesson: ModelRef<LessonSchema>;

  readonly description: string;
}

export class LessonOutcome extends Model implements LessonOutcomeParams {
  readonly type = 'lesson-outcome';

  readonly subject: ModelRef<Subject>;
  readonly unit: ModelRef<Unit>;
  readonly block: ModelRef<UnitBlock>;
  readonly lesson: ModelRef<LessonSchema>;

  readonly description: string;

  constructor(params: LessonOutcomeParams) {
    super(params);

    this.subject = params.subject;
    this.unit = params.unit;
    this.block = params.block;
    this.lesson = params.lesson;

    this.description = params.description;
  }
}
