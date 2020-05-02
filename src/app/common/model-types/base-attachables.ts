import {Model} from '../model-base/model';
import {ModelRef} from '../model-base/model-ref';
import {User} from './user';


export interface Attachable<T extends Model> extends Model {
  attachedToType: T['type'];
  attachedTo: ModelRef<T>;

  createdBy: ModelRef<User>;
  createdAt: Date;

  deleted: boolean;
  deletedAt: Date | null;
}

export interface Comment<T extends Model> extends Attachable<T> {
  replyTo: ModelRef<Comment<T>> | null;

  content: string;
  contentHtml: string;
}
