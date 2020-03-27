import {parse as parseDate} from 'date-fns';

import {Model, ModelParams} from '../model-base/model';
import {ModelRef} from '../model-base/model-ref';
import {LessonSchema} from './lesson-schema';
import {Student} from './student';

export type Rating = 0 | 1 | 2 | 3 | 4;

export interface Assessment {
  readonly date: Date | string;
  readonly rating: Rating;
}

export function fromAssessment(assessment: Assessment): Assessment {
  return {
    date: typeof assessment.date === 'string'
      ? parseDate(assessment.date, 'yyyy-mm-dd', new Date())
      : assessment.date,
    rating: assessment.rating
  };
}

export function fromAssessmentMap(map: {[k: string]: Assessment | null}): {[k: string]: Assessment} {
  const result = {};
  for (const id of Object.keys(map)) {
    result[id] = map[id] && fromAssessment(map[id]);
  }
  return result;
}


export interface LessonResultParams extends ModelParams {
  readonly lesson: ModelRef<LessonSchema>;
  readonly student: ModelRef<Student>;

  /**
   * Marked by teacher as complete when evidence of completion has been presented
   */
  readonly prelearningAssessment: Assessment | null;

  readonly outcomeSelfAssessments: Readonly<{
    [outcomeId: string]: Assessment;
  }>;

  readonly outcomeBlockAssessments: Readonly<{
    [outcomeId: string]: Assessment;
  }>;
}

export class LessonResult extends Model implements LessonResultParams {
  readonly type = 'lesson-result';

  readonly lesson: ModelRef<LessonSchema>;
  readonly student: ModelRef<Student>;

  readonly prelearningAssessment: Assessment | null;

  readonly outcomeSelfAssessments: Readonly<{
    [outcomeId: string]: Assessment | null;
  }>;

  readonly outcomeBlockAssessments: Readonly<{
    [outcomeId: string]: Assessment | null;
  }>;

  constructor(params: LessonResultParams) {
    super(params);

    this.lesson = params.lesson;
    this.student = params.student;

    this.prelearningAssessment = params.prelearningAssessment
                              && fromAssessment(params.prelearningAssessment);


    this.outcomeSelfAssessments = fromAssessmentMap(params.outcomeSelfAssessments);
    this.outcomeBlockAssessments = fromAssessmentMap(params.outcomeBlockAssessments);
  }
}
