import {ModelRef, modelRefFromJson, modelRefId} from '../model-base/model-ref';
import {AnyAssessment, Assessment, AssessmentType, CompletionState} from './assessments';
import json, {JsonObject} from '../json';

export type AssessmentAttemptType
  = 'unit-assessment-attempt'
  | 'block-assessment-attempt'
  | 'lesson-prelearning-assessment-attempt'
  | 'lessonoutcome-self-assessment-attempt';


export interface AssessmentAttempt extends JsonObject {
  readonly type: AssessmentAttemptType;
  readonly assessmentType
  readonly assessment: ModelRef<Assessment>;
  readonly attemptNumber: number;
  readonly date: Date;
}

export const AssessmentAttempt = {
  properties: <T extends Assessment>(assessmentType: T['type']) => ({
    type: assessmentType + '-attempt' as AssessmentAttemptType,
    assessmentType: assessmentType,
    assessment: modelRefFromJson(AnyAssessment.fromJson),
    attemptNumber: json.number,
    date: json.date
  })
};

export interface RatingBasedAssessmentAttempt extends AssessmentAttempt {
}

export const RatingBasedAssessmentAttempt = {
  properties: <T extends Assessment>(assessmentType: T['type']) => ({
    ...AssessmentAttempt.properties(assessmentType)
  }),
};


export interface CompletionBasedAssessmentAttempt extends AssessmentAttempt {
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
  toJson: (obj: CompletionBasedAssessmentAttempt) => ({
    type: obj.assessmentType + '-attempt',
    assessmentType: obj.assessmentType,
    assessment: modelRefId(obj.assessment),
    completionState: obj.completionState,
  }),
};

export const BlockAssessmentAttempt = {
  fromJson: (obj) => json.object(RatingBasedAssessmentAttempt.properties('block-assessment'), obj)
};

export const UnitAssessmentAttempt = {
  fromJson: (obj) => json.object(RatingBasedAssessmentAttempt.properties('unit-assessment'), obj)
};

export const LessonPrelearningAssessmentAttempt = {
  fromJson: (obj) => json.object(CompletionBasedAssessmentAttempt.properties('lesson-prelearning-assessment'), obj)
};

export const LessonOutcomeSelfAssessmentAttempt = {
  fromJson: (obj) => json.object(RatingBasedAssessmentAttempt.properties('lesson-outcome-self-assessment'), obj)
};

export type AnyAttempt = CompletionBasedAssessmentAttempt | RatingBasedAssessmentAttempt;

export const AnyAttempt = {
  fromJson: (object: unknown): AnyAttempt => {
    function getAssessmentType(obj: unknown): AssessmentType {
      return json.object({assessmentType: AssessmentType.fromJson}, obj).assessmentType;
    }

    return json.union(
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
