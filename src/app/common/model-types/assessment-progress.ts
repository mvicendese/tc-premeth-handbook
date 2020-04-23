import json from '../json';

import {
  AnyAssessment,
  Assessment,
  AssessmentType,
  BlockAssessment,
  LessonOutcomeSelfAssessment,
  LessonPrelearningAssessment,
  UnitAssessment
} from './assessments';
import {ModelDocument} from '../model-base/document';
import {ModelRef} from '../model-base/model-ref';
import {Student} from './schools';
import {Subject, SubjectNode} from './subjects';

export interface Progress<T extends Assessment = AnyAssessment> extends ModelDocument {
  readonly assessmentType: T['type'];
  readonly student: ModelRef<Student>;

  readonly subject: ModelRef<Subject>;

  // Aggregtes the results over all children of the specified node.
  // If null, all results over the course of the subject are included
  readonly node: ModelRef<SubjectNode> | null;

  readonly assessmentCount: number;
  readonly assessments: (ModelRef<AnyAssessment>)[];

  readonly attemptedAssessmentCount: number;
  readonly attemptedAssessments: (ModelRef<AnyAssessment>)[];

  readonly percentAttempted: number;
}

export const Progress = {
  properties: <T extends Assessment>(type: T['type']) => ({
    ...ModelDocument.properties,
    assessmentType: {value: type},
    student: ModelRef.fromJson(Student.fromJson),
    subject: ModelRef.fromJson(Subject.fromJson),
    node: json.nullable(ModelRef.fromJson(SubjectNode.fromJson)),

    assessmentCount: json.number,
    assessments: json.array(ModelRef.fromJson(AnyAssessment.fromJson)),

    attemptedAssessmentCount: json.number,
    attemptedAssessments: json.array(ModelRef.fromJson(AnyAssessment.fromJson)),

    percentAttempted: json.number
  })
};

export interface RatingsBasedProgress<T extends Assessment = AnyAssessment> extends Progress<T> {

}

export const RatingsBasedProgress = {
  properties: <T extends Assessment>(type: T['type']) => ({
    ...Progress.properties<T>(type),
 }),
  fromJson: (obj) => json.object(RatingsBasedProgress.properties, obj)
};

export interface CompletionBasedProgress<T extends Assessment = AnyAssessment> extends Progress<T> {
  readonly completeAssessmentCount: number;
  readonly completeAssessments: (ModelRef<AnyAssessment>)[];

  readonly partiallyCompleteAssessmentCount: number;
  readonly partiallyCompleteAssessments: (ModelRef<AnyAssessment>)[];
}

export const CompletionBasedProgress = {
  properties: <T extends Assessment>(type: T['type']) => ({
    ...Progress.properties<T>(type),
    completeAssessmentCount: json.number,
    completeAssessments: json.array(ModelRef.fromJson(AnyAssessment.fromJson)),
    partiallyCompleteAssessmentCount: json.number,
    partiallyCompleteAssessments: json.array(ModelRef.fromJson(AnyAssessment.fromJson))
  }),
  fromJson: (obj) => json.object(CompletionBasedProgress.properties, obj)
};

export interface UnitAssessmentProgress extends RatingsBasedProgress {
  readonly assessmentType: 'unit-assessment';
}

export const UnitAssessmentProgress = {
  properties: {
    ...RatingsBasedProgress.properties<UnitAssessment>('unit-assessment'),
  },
  fromJson: (obj: unknown) => json.object(UnitAssessmentProgress.properties, obj)
};

export interface BlockAssessmentProgress extends RatingsBasedProgress {
  readonly assessmentType: 'block-assessment';
}

export const BlockAssessmentProgress = {
  properties: {
    ...RatingsBasedProgress.properties<BlockAssessment>('block-assessment'),
  },
  fromJson: (obj: unknown) => json.object(BlockAssessmentProgress.properties, obj)
};

export interface LessonPrelearningAssessmentProgress extends CompletionBasedProgress {
  readonly assessmentType: 'lesson-prelearning-assessment';
}

export const LessonPrelearningAssessmentProgress = {
  properties: {
    ...CompletionBasedProgress.properties<LessonPrelearningAssessment>('lesson-prelearning-assessment'),
  },
  fromJson: (obj: unknown) => json.object(LessonPrelearningAssessmentProgress.properties, obj)
};

export interface LessonOutcomeSelfAssessmentProgress extends RatingsBasedProgress {
  readonly assessmentType: 'lesson-outcome-self-assessment';
}

export const LessonOutcomeSelfAssessmentProgress = {
  properties: {
    ...RatingsBasedProgress.properties<LessonOutcomeSelfAssessment>('lesson-outcome-self-assessment')
  },
  fromJson: (obj: unknown) => json.object(LessonOutcomeSelfAssessmentProgress.properties, obj)
};

export type AnyProgress
  = UnitAssessmentProgress
  | BlockAssessmentProgress
  | LessonPrelearningAssessmentProgress
  | LessonOutcomeSelfAssessmentProgress;

export const AnyProgress = {
  fromJson: (obj: unknown) => {
    function getAssessmentType(object: unknown): AssessmentType {
      return json.object({assessmentType: AssessmentType.fromJson}, object).assessmentType;
    }

    return json.union<AnyProgress>(
      getAssessmentType,
      {
        'unit-assessment': UnitAssessmentProgress.fromJson,
        'block-assessment': BlockAssessmentProgress.fromJson,
        'lesson-prelearning-assessment': LessonPrelearningAssessmentProgress.fromJson,
        'lesson-outcome-self-assessment': LessonOutcomeSelfAssessmentProgress.fromJson
      },
      obj
    );

  }
};
