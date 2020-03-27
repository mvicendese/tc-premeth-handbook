import {Model, ModelParams} from '../model-base/model';
import {isModelRefId, ModelRef} from '../model-base/model-ref';
import {UnitBlock} from './unit-block';
import {SubjectNode} from './subject';

import {parseDateParam} from '../model-base/decoders';
import {Student, StudentParams} from './student';

export type AssessmentType
    = 'unit-assessment'
    | 'block-assessment'
    | 'lesson-prelearning-assessment'
    | 'lesson-outcome-self-assessment';

export type ResultType
    = 'rating'
    | 'marked'
    | 'completion';

export interface AssessmentParams extends ModelParams {
  readonly type: AssessmentType;
  readonly resultType: ResultType;
  readonly student: ModelRef<Student>;

  readonly subjectNode: ModelRef<SubjectNode>;
}

export interface MarkedAssessmentParams extends ModelParams {
  readonly type: AssessmentType;
  readonly resultType: 'marked';
  readonly isAttempted: true;

  readonly maximumAvailableMark: number;

  readonly bestMark: number;
  readonly bestMarkPercent: number;
  readonly bestMarkAt: Date;

  readonly attempts: AssessmentAttempt[];
}

export interface RatedAssessmentParams extends ModelParams {
  readonly isRated: boolean;
  readonly rating: number | null;
  readonly ratedAt: string | Date;
}

export interface CompletionBasedAssessmentParams extends ModelParams {
  readonly isCompleted: boolean;
  readonly completedAt: string | Date;
}

export class Assessment extends Model implements AssessmentParams {
  readonly type: AssessmentType;
  readonly resultType: ResultType;

  readonly student: ModelRef<Student>;
  readonly subjectNode: ModelRef<SubjectNode>;

  constructor(params: AssessmentParams) {
    super(params);
    this.type = params.type;

    this.student = !isModelRefId(params.student)
                 ? new Student(params.student as StudentParams)
                 : params.student;

  }
}

export type BlockAssessmentParams = AssessmentParams & RatedAssessmentParams;

export class BlockAssessment extends Assessment implements BlockAssessmentParams {
  readonly type = 'block-assessment';
  readonly block: ModelRef<UnitBlock>;

  isRated: boolean;
  ratedAt: Date;
  rating: number | null;

  constructor(params: BlockAssessmentParams) {
    super(params);

    this.isRated = params.isRated;
    this.ratedAt = parseDateParam(params.ratedAt);
    this.rating = params.rating;
  }

}

export interface AssessmentAttempt extends ModelParams {
  readonly assessment: ModelRef<Assessment>;
  readonly date: Date;
}

export interface MarkedAssessmentAttempt extends ModelParams {
  readonly mark: number;
  readonly markPercent: number;
}

export type LessonPrelearningAssessmentParams = AssessmentParams & CompletionBasedAssessmentParams;

export class LessonPrelearningAssessment extends Assessment implements LessonPrelearningAssessmentParams {
  readonly type = 'lesson-prelearning-assessment';

  readonly isCompleted: boolean;
  readonly completedAt: Date;

  constructor(params: LessonPrelearningAssessmentParams) {
    super(params);

    this.isCompleted = params.isCompleted;
    this.completedAt = parseDateParam(params.completedAt);
  }
}

