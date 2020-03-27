import {Subject} from './subject';
import {Model, ModelParams} from '../model-base/model';
import {Unit} from './unit';
import {LessonSchema, LessonSchemaParams} from './lesson-schema';
import {getModelRefId, ModelRef} from '../model-base/model-ref';
import {BlockAssessment, BlockAssessmentParams} from './assessment';


export interface UnitBlockParams extends ModelParams {
  readonly unit: ModelRef<Unit>;

  readonly name: string;
  readonly lessons: LessonSchemaParams[];
}

export class UnitBlock extends Model implements UnitBlockParams {
  readonly type = 'unit-block';
  readonly unit: ModelRef<Unit>;

  readonly name: string;
  readonly lessons: LessonSchema[];

  constructor(params: UnitBlockParams) {
    super(params);
    this.unit = params.unit;

    this.name = params.name;
    this.lessons = params.lessons.map(lesson => {
      const unitId = getModelRefId(lesson.block);
      if (unitId !== this.id) {
        throw new Error(`Unexpected lesson in unit block lessons.`);
      }

      return new LessonSchema({
        ...lesson,
        block: this
      });
    });

  }

  getLesson(lesson: ModelRef<LessonSchema>): LessonSchema | undefined {
    const lessonId = getModelRefId(lesson);
    return this.lessons.find(item => item.id === lessonId);
  }

}
