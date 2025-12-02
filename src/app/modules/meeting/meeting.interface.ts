import { Types } from 'mongoose';

export type IMeetingType = 'scheduled' | 'instant';

export type IMeeting = {
  title?: string;
  creator: Types.ObjectId;
  participant: Types.ObjectId;
  meetingType: IMeetingType;
  startTime?: Date;
  endTime?: Date;
  roomId: string;
  joinLink: string;
  isClosed?: boolean;
  closedAt?: Date;
};

export type MeetingModel = {
  isAuthorized(meetingId: string, userId: string): Promise<boolean>;
} & Document;