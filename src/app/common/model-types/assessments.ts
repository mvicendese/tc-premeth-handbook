import json, {isJsonObject, JsonObject, JsonObjectProperties, parseError} from '../json';

import {ModelRef, modelRefFromJson} from '../model-base/model-ref';
import {School, schoolFromJson, Student} from './schools';
import {Block, LessonOutcome, LessonSchema, Subject, SubjectNode, subjectNodeFromJson} from './subjects';
import {createModel, Model, modelProperties} from '../model-base/model';
import {lessonOutcomeSelfAssessmentReportFromJson} from './assessment-reports';

export type AssessmentType
  = 'unit-assessment'
  | 'block-assessment'
  | 'lesson-prelearning-assessment'
  | 'lesson-outcome-self-assessment';

const allAssessmentTypes = [
  'unit-assessment',
  'block-assessment',
  'lesson-prelearning-assessment',
  'lessonoutcome-self-assessment'
];

export const AssessmentType = {
  fromJson: (obj: unknown) => {
    const str = json.string(obj);
    if (allAssessmentTypes.includes(str)) {
      return str as AssessmentType;
    }
    throw parseError(`Expected an assessment type`);
  }
};

export interface Assessment extends Model {
  readonly type: AssessmentType;

  readonly school: ModelRef<School>;
  readonly subject: ModelRef<Subject>;
  readonly student: ModelRef<Student>;

  readonly node: ModelRef<SubjectNode>;

  readonly isAttempted: boolean;
  readonly attemptedAt: Date | null;
}

function assessmentProperties(assessmentType: AssessmentType): JsonObjectProperties<Assessment> {
  return {
    ...modelProperties(assessmentType),
    school: modelRefFromJson(schoolFromJson),
    subject: modelRefFromJson(Subject.fromJson),
    student: modelRefFromJson(Student.fromJson),

    node: modelRefFromJson(subjectNodeFromJson),

    isAttempted: json.bool,
    attemptedAt: json.nullable(json.date)
  };
}

function createAssessment<T extends Assessment>(assessmentType: T['type'], options: {
  subject: ModelRef<Subject>,
  subjectNode: ModelRef<SubjectNode>,
  student: Student,
}): Partial<T> {
  return {
    ...createModel<T>(assessmentType),
    school: options.student.school,
    subject: options.subject,
    student: options.student,
    node: options.subjectNode,

    isAttempted: false,
    attemptedAt: null
  } as Partial<T>;
}

export type CompletionState = 'none' | 'partial' | 'complete';
export function completionStateFromJson(obj: unknown) {
  if (['partial-complete', 'complete'].includes(json.string(obj))) {
    return obj;
  }
  throw parseError('Expected a completion state');
}

export interface CompletionBasedAssessment extends Assessment {
  readonly completionState: CompletionState;
  readonly isPartiallyComplete: boolean;
  readonly isComplete: boolean;
}
export const defaultCompletionBasedAssessment: Partial<CompletionBasedAssessment> = {
  completionState: 'none',
  isPartiallyComplete: false,
  isComplete: false
};

function completionBasedAssessmentProperties(assessmentType: AssessmentType): JsonObjectProperties<CompletionBasedAssessment> {
  return {
    ...assessmentProperties(assessmentType),
    isCompleted: json.bool,
    completionState: json.nullable(completionStateFromJson)
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
}

export function createPrelearningAssessment(lesson: LessonSchema, student: Student): LessonPrelearningAssessment {
  return {
    ...createAssessment('lesson-prelearning-assessment', {
      subject: lesson.subject,
      subjectNode: lesson,
      student
    }),
    ...defaultCompletionBasedAssessment,
    lesson,
  } as LessonPrelearningAssessment;
}

export function lessonPrelearningAssessmentFromJson(obj: unknown): LessonPrelearningAssessment {
  return json.object<LessonPrelearningAssessment>({
    ...completionBasedAssessmentProperties('lesson-prelearning-assessment'),
    lesson: modelRefFromJson(LessonSchema.fromJson),
    isComplete: json.bool,
    isPartiallyComplete: json.bool,
    completionState: completionStateFromJson
  }, obj);
}

export interface LessonOutcomeSelfAssessment extends RatingBasedAssessment {
  readonly type: 'lesson-outcome-self-assessment';
  readonly lessonOutcome: ModelRef<LessonOutcome>;
}

export type AnyAssessment
  = LessonPrelearningAssessment
  | LessonOutcomeSelfAssessment;

export const AnyAssessment = {
  fromJson: (obj: unknown) => {
    let assessmentType;
    if (isJsonObject(obj)) {
      assessmentType = AssessmentType.fromJson((obj as any).type);
    } else {
      assessmentType = undefined;
    }
    switch (assessmentType) {
      case 'lesson-prelearning-assessment':
        return lessonPrelearningAssessmentFromJson(obj);
      case 'lessonoutcome-self-assessment':
        return lessonOutcomeSelfAssessmentReportFromJson(obj);
      default:
        throw parseError(`Invalid assessment type: ${assessmentType}`);
    }
  }
};
