import json, {Decoder} from '../json';
import {Model} from '../model-base/model';
import {User} from '../../features/base/auth/user.model';
import {modelMeta} from '../model-base/model-meta';
import {Validators} from '@angular/forms';
import {Ref, refFromJson} from '../model-base/ref';


export interface Attachment extends Model {
  readonly attachedToType: string;
  readonly attachedTo: Ref<Model>;

  readonly createdBy: Ref<User>;
  readonly createdAt: Date;
}

export const Attachment = modelMeta<Attachment>({
  create(args: Partial<Attachment>) {
    throw new Error('not implemented');
  },
  properties: {
    ...Model.properties,
    attachedToType: json.string as Decoder<any>,
    attachedTo: refFromJson('model', Model.fromJson),
    createdBy: refFromJson('user', User.fromJson),
    createdAt: json.date,
  }
});

export const createAttachmentForm = {
  attachedToType: ['', [Validators.required]],
  attachedTo:     ['', [Validators.required]]
}


// For the moment, everything is attachable.
export type Attachable = Model;
export const Attachable = Model;
