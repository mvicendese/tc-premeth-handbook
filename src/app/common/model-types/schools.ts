import json, {parseError} from '../json';
import {BaseModel, Model} from '../model-base/model';
import {Subject} from './subjects';
import {modelMeta} from '../model-base/model-meta';
import {Ref, refFromJson} from '../model-base/ref';

export interface School extends Model {
  readonly type: 'school';
  readonly name: string;
}

export const School = modelMeta<School>({
  properties: {
    ...Model.properties,
    type: {value: 'school'},
    name: json.string
  },
  create: () => { throw new Error('not implemented'); }
})


export interface Person extends Model {
  readonly school: Ref<School>;
  readonly firstName: string;
  readonly surname: string;
  readonly fullName: string;
  readonly email: string;
  readonly avatarHref: string | null;
}

export const Person = modelMeta<Person>({
  create() {
    throw new Error('not implemented');
  },
  properties: {
    ...Model.properties,
    firstName: json.string,
    surname: json.string,
    fullName: json.string,
    email: json.string,
    school: refFromJson('school', School.fromJson),
    avatarHref: json.nullable(json.string)
  },
  fromJson(obj: unknown) {
    function fromType(o: unknown): 'student' | 'teacher' {
      const type = json.object({type: json.string}, o).type;
      if (['student', 'teacher'].includes(type)) {
        return type as 'student' | 'teacher';
      }
      throw parseError('Expected either \'student\' or \'teacher\'');
    }

    return json.union(fromType, { student: Student.fromJson, teacher: Teacher.fromJson }, obj);
  }
});

export interface StudentParams extends Person {
  readonly type: 'student';
  readonly studentCode: string;

  readonly yearLevel: number;
  readonly compassNumber: number;
}

function studentParamsFromJson(obj: unknown): StudentParams {
  return json.object<StudentParams>({
    ...Person.properties,
    type: { value: 'student' },
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
  readonly school: Ref<School>;

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

  get avatarHref(): string {
    return '';
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
    ...Person.properties,
    type: { value: 'teacher' },
    teacherCode: json.string
  })
};

export interface SubjectClass extends Model {
  readonly type: 'class';
  readonly subject: Ref<Subject>;

  readonly year: number;
  readonly teacher: Ref<Teacher>;
  readonly subgroup: string;
  readonly classCode: string;

  readonly students: Student[];

  hasStudent(ref: Ref<Student>): boolean;
}

export const SubjectClass = modelMeta<SubjectClass>({
  create(args: Partial<SubjectClass>) {
    throw new Error('not implemented');
  },
  properties: {
    ...Model.properties,
    type: { value: 'class' },
    subject: refFromJson('subject', Subject.fromJson),
    year: json.number,
    teacher: refFromJson('teacher', Teacher.fromJson),
    subgroup: json.string,
    classCode: json.string,
    students: json.array(Student.fromJson),

    hasStudent: {
      value(student: Ref<Student>) {
        return this.students.map(s => s.id).includes(student.id);
      },
      enumerable: true
    }
  },
  fromJson: (obj: unknown): SubjectClass => {
    return json.object(SubjectClass.properties, obj);
  }
});

