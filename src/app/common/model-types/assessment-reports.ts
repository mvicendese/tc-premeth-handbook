import json, {JsonObjectProperties} from '../json';
import {Model, modelProperties} from '../model-base/model';
import {ModelRef, modelRefFromJson} from '../model-base/model-ref';
import {School, schoolFromJson, Student, SubjectClass, subjectClassFromJson} from './schools';
import {Subject, SubjectNode, subjectNodeFromJson} from './subjects';
import {AssessmentType} from './assessments';

export type AssessmentReportType
  = 'unit-assessment-report'
  | 'block-assessment-report'
  | 'lesson-prelearning-assessment-report'
  | 'lesson-outcome-self-assessment-report';

export function fromAssessmentType(assessmentType: AssessmentType): AssessmentReportType {
  return [assessmentType, 'report'].join('-') as AssessmentReportType;
}

export function toAssessmentType(reportType: AssessmentReportType): AssessmentType {
  return reportType.split('-report')[0] as AssessmentType;
}

export interface Report extends Model {
  readonly type: AssessmentReportType;
  readonly assessmentType: AssessmentType;

  readonly school: ModelRef<School>;
  readonly subject: ModelRef<Subject>;
  readonly node: ModelRef<SubjectNode>;

  readonly subjectClass: ModelRef<SubjectClass> | null;

  readonly generatedAt: Date;

  readonly totalCandidateCount: number;
  readonly candidateIds: ReadonlyArray<ModelRef<Student>>;
  readonly attemptedCandidateCount: number;
  readonly attemptedCandidateIds: ReadonlyArray<Student>;

  readonly percentAttempted: number;
}

export function reportProperties(assessmentType: AssessmentType): JsonObjectProperties<Report> {
  return {
    ...modelProperties(fromAssessmentType(assessmentType)),
    assessmentType,
    school: modelRefFromJson(schoolFromJson),
    subject: modelRefFromJson(Subject.fromJson),
    node: modelRefFromJson(subjectNodeFromJson),
    subjectClass: json.nullable(modelRefFromJson(subjectClassFromJson)),
    generatedAt: json.date,

    totalCandidateCount: json.number,
    candidateIds: json.array(modelRefFromJson(Student.fromJson)),
    attemptedCandidateCount: json.number,
    attemptedCandidateIds: json.array(modelRefFromJson(Student.fromJson)),

    percentAttempted: json.number
  };
}

export interface LessonPrelearningReport extends Report {
  readonly percentCompleted: number;

  readonly completedCandidateCount: number;
  readonly mostRecentCompletionAt: Date | null;

  readonly completedCandidateIds: string[];
}

export function lessonPrelearningReportFromJson(obj: unknown): LessonPrelearningReport {
  return json.object<LessonPrelearningReport>({
    ...reportProperties('lesson-prelearning-assessment'),
    percentCompleted: json.number,
    completedCandidateCount: json.number,
    completedCandidateIds: json.array(modelRefFromJson(Student.fromJson)),
    mostRecentCompletionAt: json.nullable(json.date)
  }, obj);
}

export interface LessonOutcomeSelfAssessmentReport extends Report {
  ratingAverage: number;
  ratingStdDeviation: number;
}

export function lessonOutcomeSelfAssessmentReportFromJson(obj: unknown): LessonOutcomeSelfAssessmentReport {
  return json.object<LessonOutcomeSelfAssessmentReport>({
    ...reportProperties('lesson-outcome-self-assessment'),
    ratingAverage: json.nullable(json.number),
    ratingStdDeviation: json.nullable(json.number)
  }, obj);
}

export type AnyReport = LessonPrelearningReport | LessonOutcomeSelfAssessmentReport;


