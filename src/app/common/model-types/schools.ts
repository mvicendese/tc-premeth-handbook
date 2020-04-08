import json, {Decoder, JsonObject, JsonObjectProperties} from '../json';
import {BaseModel, Model, modelProperties} from '../model-base/model';
import {ModelRef, modelRefFromJson} from '../model-base/model-ref';
import {Subject} from './subjects';

export interface School extends Model {
  readonly type: 'school';
  readonly name: string;
}

export function schoolFromJson(obj: unknown): School {
  return json.object<School>({
    ...modelProperties('school'),
    name: json.string
  }, obj);
}


export interface Person extends Model {
  readonly firstName: string;
  readonly surname: string;
  readonly fullName: string;
  readonly email: string;
}

function personProperties(type: string): JsonObjectProperties<Person> {
  return {
    ...modelProperties(type),
    firstName: json.string,
    surname: json.string,
    fullName: json.string,
    email: json.string
  };
}

export function personFromJson(obj: JsonObject): Person {
  const type = json.string(obj.type);

  return json.object(personProperties(type), obj);
}

export interface StudentParams extends Person {
  readonly type: 'student';
  readonly studentCode: string;

  readonly yearLevel: number;
  readonly compassNumber: number;
}

function studentParamsFromJson(obj: unknown): StudentParams {
  return json.object<StudentParams>({
    ...personProperties('student'),
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
  }

  get group(): 'junior' | 'senior' {
    return this.yearLevel <= 9 ? 'junior' : 'senior';
  }

  get fullName() {
    return [this.firstName, this.surname].join(' ');
  }

  get email() {
    return `${this.code}@tc.vic.edu.au`;
  }

  get compassLink() {
    return `https://tc-vic.compass.education/Records/User.aspx?userId=${this.compassNumber}`;
  }
}

export interface Teacher extends Person {
  readonly type: 'teacher';
  readonly id: string;
  readonly teacherCode: string;
}

export function teacherFromJson(obj: unknown): Teacher {
  return json.object<Teacher>({
    ...personProperties('teacher'),
    name: json.string,
    email: json.string,
    teacherCode: json.string
  }, obj);
}

export interface SubjectClass extends Model {
  readonly type: 'class';
  readonly subject: ModelRef<Subject>;

  readonly year: number;
  readonly teacher: ModelRef<Teacher>;
  readonly subgroup: string;
  readonly classCode: string;

  readonly students: Student[];
}

export function subjectClassFromJson(obj: unknown): SubjectClass {
  return json.object<SubjectClass>({
    ...modelProperties('class'),
    subject: modelRefFromJson(Subject.fromJson),
    year: json.number,
    teacher: modelRefFromJson(teacherFromJson),
    subgroup: json.string,
    classCode: json.string,
    students: json.array(Student.fromJson)
  }, obj);
}

