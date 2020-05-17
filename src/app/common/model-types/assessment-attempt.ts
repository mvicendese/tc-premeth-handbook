import {
  AnyAssessment,
  Assessment,
  AssessmentType,
  BlockAssessment,
  CompletionState, LessonOutcomeSelfAssessment,
  LessonPrelearningAssessment,
  UnitAssessment
} from './assessments';
import json, {Decoder} from '../json';
import {Ref, refFromJson} from '../model-base/ref';



export interface AssessmentAttempt<T extends Assessment = Assessment> {
  readonly assessmentType: T['type'];
  readonly assessment: Ref<T>;
  readonly attemptNumber: number;
  readonly createdAt: Date;
}

export const AssessmentAttempt = {
  properties: <T extends Assessment>(assessmentType: T['type']) => ({
    assessmentType: {value: assessmentType},
    assessment: refFromJson(assessmentType, AnyAssessment.fromJson as Decoder<T>),
    attemptNumber: json.number,
    createdAt: json.date
  })
};

export interface RatingBasedAssessmentAttempt<T extends Assessment> extends AssessmentAttempt<T> {
}

export const RatingBasedAssessmentAttempt = {
  properties: <T extends Assessment>(assessmentType: T['type']) => ({
    ...AssessmentAttempt.properties(assessmentType)
  }),
};


export interface CompletionBasedAssessmentAttempt<T extends Assessment> extends AssessmentAttempt<T> {
  readonly completionState: CompletionState;
  readonly isComplete: boolean;
  readonly isPartiallyComplete: boolean;
}

export const CompletionBasedAssessmentAttempt = {
  properties: <T extends Assessment>(assessmentType: T['type']) => ({
    ...AssessmentAttempt.properties(assessmentType),
    completionState: CompletionState.fromJson,
    isComplete: json.bool,
    isPartiallyComplete: json.bool
  }),
  toJson: <T extends Assessment>(obj: CompletionBasedAssessmentAttempt<T>) => ({
    assessmentType: obj.assessmentType,
    assessment: obj.assessment.id,
    completionState: obj.completionState,
  }),
};

export interface BlockAssessmentAttempt extends RatingBasedAssessmentAttempt<BlockAssessment> {

}

export const BlockAssessmentAttempt = {
  fromJson: (obj) => json.object<BlockAssessmentAttempt>(
    RatingBasedAssessmentAttempt.properties<BlockAssessment>('block-assessment'),
    obj
  )
};

export interface UnitAssessmentAttempt extends RatingBasedAssessmentAttempt<UnitAssessment> {

}

export const UnitAssessmentAttempt = {
  fromJson: (obj) => json.object<UnitAssessmentAttempt>(
    RatingBasedAssessmentAttempt.properties('unit-assessment'),
    obj
  )
};

export interface LessonPrelearningAssessmentAttempt extends CompletionBasedAssessmentAttempt<LessonPrelearningAssessment> {
  completionState: CompletionState;
}

export const LessonPrelearningAssessmentAttempt = {
  fromJson: (obj) => json.object(CompletionBasedAssessmentAttempt.properties<LessonPrelearningAssessment>('lesson-prelearning-assessment'), obj),
  toJson: (attempt) => CompletionBasedAssessmentAttempt.toJson(attempt)
};

export interface LessonOutcomeSelfAssessmentAttempt extends RatingBasedAssessmentAttempt<LessonOutcomeSelfAssessment> {

}

export const LessonOutcomeSelfAssessmentAttempt = {
  fromJson: (obj) => json.object(RatingBasedAssessmentAttempt.properties<LessonOutcomeSelfAssessment>('lesson-outcome-self-assessment'), obj)
};

export type AnyAttempt
  = RatingBasedAssessmentAttempt<UnitAssessment>
  | RatingBasedAssessmentAttempt<BlockAssessment>
  | RatingBasedAssessmentAttempt<LessonOutcomeSelfAssessment>
  | CompletionBasedAssessmentAttempt<LessonPrelearningAssessment>;

export const AnyAttempt = {
  fromJson: (object: unknown): AnyAttempt => {
    function getAssessmentType<T extends AssessmentType>(obj: unknown): T {
      return json.object({assessmentType: AssessmentType.fromJson}, obj).assessmentType as T;
    }

    return json.union<AnyAttempt>(
      getAssessmentType,
      {
        'unit-assessment': UnitAssessmentAttempt.fromJson,
        'block-assessment': BlockAssessmentAttempt.fromJson,
        'lesson-prelearning-assessment': LessonPrelearningAssessmentAttempt.fromJson,
        'lesson-outcome-self-assessment': LessonOutcomeSelfAssessmentAttempt.fromJson
      },
      object
    );
  }
};
