import {ModelRef, modelRefFromJson, modelRefId} from '../model-base/model-ref';
import {AnyAssessment, Assessment, AssessmentType, CompletionState, completionStateFromJson} from './assessments';
import {Model} from '../model-base/model';
import json, {isJsonObject, JsonObject, parseError} from '../json';

export type AssessmentAttemptType
  = 'unit-assessment-attempt'
  | 'block-assessment-attempt'
  | 'lesson-prelearning-assessment-attempt'
  | 'lessonoutcome-self-assessment-attempt';

export const AssessmentAttemptType = {
  fromAssessmentType: (type: AssessmentType) => type + '-attempt' as AssessmentAttemptType,
  toAssessmentType: (type: AssessmentAttemptType) => type.split('-attempt')[0] as AssessmentType,

  fromJson: json.string
};


export interface AssessmentAttempt extends JsonObject {
  readonly type: AssessmentAttemptType;
  readonly assessment: ModelRef<Assessment>;
  readonly attemptNumber: number;
  readonly date: Date;
}

export const AssessmentAttempt = {
  properties: {
    type: AssessmentAttemptType.fromJson,
    assessment: modelRefFromJson(AnyAssessment.fromJson),
    attemptNumber: json.number,
    date: json.date
  }
};

export interface CompletionBasedAssessmentAttempt extends AssessmentAttempt {
  readonly completionState: CompletionState;
  readonly isComplete: boolean;
  readonly isPartiallyComplete: boolean;
}

export const CompletionBasedAssessmentAttempt = {
  properties: {
    ...AssessmentAttempt.properties,
    completionState: completionStateFromJson,
    isComplete: json.bool,
    isPartiallyComplete: json.bool
  },
  toJson: (obj: CompletionBasedAssessmentAttempt) => ({
    type: obj.type,
    assessment: modelRefId(obj.assessment),
    completionState: obj.completionState,
  }),
  fromJson: (obj: unknown) => json.object<CompletionBasedAssessmentAttempt>(CompletionBasedAssessmentAttempt.properties, obj)
};

export type AnyAttempt
  = CompletionBasedAssessmentAttempt;

export const AnyAttempt = {
  fromJson: (obj: unknown) => {
    let attemptType: AssessmentAttemptType = undefined;
    if (isJsonObject(obj)) {
      attemptType = json.string(obj.type) as any;
    }
    switch (attemptType) {
      case 'lesson-prelearning-assessment-attempt':
        return CompletionBasedAssessmentAttempt.fromJson(obj);
      default:
        throw parseError(`Unrecognised assessment type: ${attemptType}`);
    }
  }
};
