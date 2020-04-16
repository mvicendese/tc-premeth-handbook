import json from '../json';

import {AnyAssessment, AssessmentType} from './assessments';
import {ModelDocument} from '../model-base/document';
import {ModelRef, modelRefFromJson} from '../model-base/model-ref';
import {Student} from './schools';
import {Subject, SubjectNode} from './subjects';

export interface Progress extends ModelDocument {
  readonly assessmentType: AssessmentType;
  readonly student: ModelRef<Student>;

  readonly subject: ModelRef<Subject>;

  // Aggregtes the results over all children of the specified node.
  // If null, all results over the course of the subject are included
  readonly node: ModelRef<SubjectNode> | null;

  readonly assessmentCount: number;
  readonly assessmentIds: (ModelRef<AnyAssessment>)[];

  readonly attemptedAssessmentCount: number;
  readonly attemptedAssessments: (ModelRef<AnyAssessment>)[];

  readonly percentAttempted: number;
}

export const Progress = {
  properties: {
    ...ModelDocument.properties,
    assessmentType: AssessmentType.fromJson,
    student: modelRefFromJson(Student.fromJson),
    subject: modelRefFromJson(Subject.fromJson),
    node: json.nullable(modelRefFromJson),

    attemptedAssessmentCount: json.number,
    attemptedAssessmentIds: json.array(modelRefFromJson(AnyAssessment.fromJson)),
  }
};

export interface RatingsBasedProgress extends Progress {

}

export const RatingsBasedProgress = {
  properties: {
    ...Progress.properties,
 },
  fromJson: (obj) => json.object(RatingsBasedProgress.properties, obj)
};

export interface CompletionBasedProgress extends Progress {
  readonly completeAssessmentCount: number;
  readonly completeAssessmentIds: (ModelRef<AnyAssessment>)[];

  readonly partiallyCompleteAssessmentCount: number;
  readonly partiallyCompleteAssessmentIds: (ModelRef<AnyAssessment>)[];
}

export const CompletionBasedProgress = {
  properties: {
    ...Progress.properties,
    completeAssessmentCount: json.number,
    completeAssessmentIds: json.array(modelRefFromJson(AnyAssessment.fromJson)),
    partiallyCompleteAssessmentCount: json.number,
    partiallyCompleteAssessmentIds: json.array(modelRefFromJson(AnyAssessment.fromJson))
  },
  fromJson: (obj) => json.object(CompletionBasedProgress.properties, obj)
};
