import { Model, Types } from 'mongoose';

export interface IUsereventFilterables {
  searchTerm?: string;
  title?: string;
  description?: string;
}

export interface IUserevent {
  _id: Types.ObjectId;
  title: string;
  description: string;
  venueId: Types.ObjectId;
  createdBy: Types.ObjectId;
  startDate: Date;
  startTime: Date;
  vibeTags: string[];
  visibility: boolean;
  goingCount: number;
  location: Record<string, any>;
  address: string;
  images?: string[];
}

export type UsereventModel = Model<IUserevent, {}, {}>;
