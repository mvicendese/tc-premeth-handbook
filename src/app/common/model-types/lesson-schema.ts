import {
  Model,
  ModelParams,
} from '../model-base/model';
import {UnitBlock} from './unit-block';
import {LessonOutcome, LessonOutcomeParams} from './lesson-outcome';
import {getModelRefId, ModelRef} from '../model-base/model-ref';


export interface LessonSchemaParams extends ModelParams {
  readonly block: ModelRef<UnitBlock>;

  readonly code: string;
  readonly name: string;

  readonly number: number;

  readonly outcomes: LessonOutcomeParams[];
  readonly exampleDescriptions: string[];
}

export class LessonSchema extends Model implements LessonSchemaParams {
  readonly type = 'lesson';

  readonly block: ModelRef<UnitBlock>;

  readonly code: string;
  readonly name: string;

  readonly number: number;

  readonly outcomes: LessonOutcome[];
  readonly exampleDescriptions: string[];

  constructor(params: LessonSchemaParams) {
    super(params);

    this.block = params.block;

    this.code = params.code;
    this.name = params.name;

    this.number = params.number;

    this.outcomes = params.outcomes.map(outcome => {
      const lessonId = getModelRefId(outcome.lesson);
      if (lessonId !== this.id) {
        throw new Error(`Invalid outcome in lesson. All outcomes must have the same parent lesson`);
      }
      return new LessonOutcome({
        ...outcome,
        block: this.block,
        lesson: this
      });
    });
    this.exampleDescriptions = params.exampleDescriptions;
  }
}
