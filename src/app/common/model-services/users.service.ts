import {Injectable} from '@angular/core';
import {ModelService, ModelServiceBackend} from '../model-base/model-service';
import {User} from '../model-types/user';
import {Observable} from 'rxjs';
import {Student} from '../model-types/schools';
import {StudentService} from './students.service';


@Injectable({providedIn: 'root'})
export class UsersService extends ModelService<User> {
  readonly fromJson = User.fromJson;

  constructor(readonly backend: ModelServiceBackend) {
    super(backend, '/users');
  }
}
