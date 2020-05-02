import {Model} from '../model-base/model';
import {ModelRef} from '../model-base/model-ref';
import {User} from './user';
import {modelMeta} from '../model-base/model-meta';


export interface Attachable<T extends Model> extends Model {
  attachedToType: T['type'];
  attachedTo: ModelRef<T>;

  createdBy: ModelRef<User>;
  createdAt: Date;

  deleted: boolean;
  deletedAt: Date | null;
}

export const Attachable = modelMeta<Attachable<any>>({
  properties: {} as any,
  create: (args) => {
    throw new Error('not implemented');
  }
});

export interface Comment<T extends Model> extends Attachable<T> {
  replyTo: ModelRef<Comment<T>> | null;

  content: string;
  contentHtml: string;
}

export const Comment = modelMeta<Comment<any>>({
  properties: {} as any,
  create: (args) => {
    throw new Error('not implemented');
  }
});
