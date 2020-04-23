import json, {JsonObject} from '../json';
import {BaseModel, Model, modelProperties} from '../model-base/model';
import {ModelRef} from '../model-base/model-ref';
import {Subject} from './subjects';

export interface School extends Model {
  readonly type: 'school';
  readonly name: string;
}

export function schoolFromJson(obj: unknown): School {
  return json.object({
    ...modelProperties<School>('school'),
    name: json.string
  }, obj);
}


export interface Person extends Model {
  readonly school: ModelRef<School>;
  readonly firstName: string;
  readonly surname: string;
  readonly fullName: string;
  readonly email: string;
}

function personProperties<T extends Person>(type: T['type']) {
  return {
    ...modelProperties<T>(type),
    firstName: json.string,
    surname: json.string,
    fullName: json.string,
    email: json.string,
    school: ModelRef.fromJson(schoolFromJson)
  };
}

export interface StudentParams extends Person {
  readonly type: 'student';
  readonly studentCode: string;

  readonly yearLevel: number;
  readonly compassNumber: number;
}

function studentParamsFromJson(obj: unknown): StudentParams {
  return json.object<StudentParams>({
    ...personProperties<StudentParams>('student'),
    studentCode: json.string,
    yearLevel: json.number,
    compassNumber: json.number,
  }, obj);
}

export class Student extends BaseModel implements StudentParams {
  static fromJson(obj: unknown): Student {
    const params = studentParamsFromJson(obj);
    return new Student(params);
  }

  readonly type = 'student';
  readonly school: ModelRef<School>;

  readonly firstName: string;
  readonly yearLevel: number;
  readonly studentCode: string;

  readonly surname: string;
  readonly compassNumber: number;

  constructor(params: StudentParams) {
    super(params);
    this.studentCode = params.studentCode;
    this.firstName = params.firstName;
    this.surname = params.surname;
    this.yearLevel = params.yearLevel;
    this.compassNumber = params.compassNumber;
    this.school = params.school;
  }

  get group(): 'junior' | 'senior' {
    return this.yearLevel <= 9 ? 'junior' : 'senior';
  }

  get fullName() {
    return [this.firstName, this.surname].join(' ');
  }

  get email() {
    return `${this.studentCode}@tc.vic.edu.au`;
  }

  get compassLink() {
    return `https://tc-vic.compass.education/Records/User.aspx?userId=${this.compassNumber}`;
  }
}

export interface Teacher extends Person {
  readonly type: 'teacher';
  readonly teacherCode: string;
}

export const Teacher = {
  fromJson: json.object<Teacher>({
    ...personProperties<Teacher>('teacher'),
    teacherCode: json.string
  })
};

export interface SubjectClass extends Model {
  readonly type: 'class';
  readonly subject: ModelRef<Subject>;

  readonly year: number;
  readonly teacher: ModelRef<Teacher>;
  readonly subgroup: string;
  readonly classCode: string;

  readonly students: Student[];
}

export const SubjectClass = {
  fromJson: json.object<SubjectClass>({
    ...modelProperties<SubjectClass>('class'),
    subject: ModelRef.fromJson(Subject.fromJson),
    year: json.number,
    teacher: ModelRef.fromJson(Teacher.fromJson),
    subgroup: json.string,
    classCode: json.string,
    students: json.array(Student.fromJson)
  })
};

