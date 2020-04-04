import json, {JsonObjectProperties} from '../json';

import {ModelRef, modelRefFromJson} from '../model-base/model-ref';
import {School, schoolFromJson, Student} from './schools';
import {Block, LessonOutcome, LessonSchema, Subject, SubjectNode, subjectNodeFromJson} from './subjects';
import {Model, modelProperties} from '../model-base/model';

export type AssessmentType
  = 'unit-assessment'
  | 'block-assessment'
  | 'lesson-prelearning-assessment'
  | 'lesson-outcome-self-assessment';

export interface Assessment extends Model {
  readonly type: AssessmentType;

  readonly school: ModelRef<School>;
  readonly subject: ModelRef<Subject>;
  readonly student: ModelRef<Student>;

  readonly node: ModelRef<SubjectNode>;

  readonly isAttempted: boolean;
  readonly attemptedAt: Date;
}

function assessmentProperties(assessmentType: AssessmentType): JsonObjectProperties<Assessment> {
  return {
    ...modelProperties(assessmentType),
    school: modelRefFromJson(schoolFromJson),
    subject: modelRefFromJson(Subject.fromJson),
    student: modelRefFromJson(Student.fromJson),

    node: modelRefFromJson(subjectNodeFromJson),

    isAttempted: json.bool,
    attemptedAt: json.date
  };
}

export interface CompletionBasedAssessment extends Assessment {
  readonly isCompleted: boolean;
}

function completionBasedAssessmentProperties(assessmentType: AssessmentType): JsonObjectProperties<CompletionBasedAssessment> {
  return {
    ...assessmentProperties(assessmentType),
    isCompleted: json.bool
  };
}

export interface RatingBasedAssessment extends Assessment {
  readonly rating: number;
}

function ratingBasedAssessmentProperties(assessmentType: AssessmentType): JsonObjectProperties<RatingBasedAssessment> {
  return {
    ...assessmentProperties(assessmentType),
    rating: json.bool
  };
}

export interface BlockAssessment extends RatingBasedAssessment {
  readonly type: 'block-assessment';
  readonly block: Block;
}

export function blockAssessmentFromJson(obj: unknown) {
  return json.object<BlockAssessment>({
    ...ratingBasedAssessmentProperties('block-assessment'),
    block: modelRefFromJson(Block.fromJson)
  }, obj);
}

export interface LessonPrelearningAssessment extends CompletionBasedAssessment {
  readonly type: 'lesson-prelearning-assessment';
  readonly lesson: ModelRef<LessonSchema>;

  readonly isCompleted: boolean;
}

export function lessonPrelearningAssessmentFromJson(obj: unknown): LessonPrelearningAssessment {
  return json.object<LessonPrelearningAssessment>({
    ...completionBasedAssessmentProperties('lesson-prelearning-assessment'),
    lesson: modelRefFromJson(LessonSchema.fromJson),
    isCompleted: json.bool
  }, obj);
}

export interface LessonOutcomeSelfAssessment extends RatingBasedAssessment {
  readonly type: 'lesson-outcome-self-assessment';
  readonly lessonOutcome: ModelRef<LessonOutcome>;


}
