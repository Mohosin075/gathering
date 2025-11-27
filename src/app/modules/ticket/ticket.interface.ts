import { Model, Types } from 'mongoose';

export interface ITicketFilterables {
  searchTerm?: string;
  promotionCode?: string;
  qrCode?: string;
  ticketNumber?: string;
}

export interface ITicket {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  attendeeId: Types.ObjectId;
  ticketType: string;
  price: number;
  quantity: number;
  totalAmount: number;
  promotionCode?: string;
  discountAmount: number;
  finalAmount: number;
  status: string;
  paymentStatus: string;
  qrCode: string;
  ticketNumber: string;
  checkedIn: boolean;
  checkedInAt?: Date;
}

export type TicketModel = Model<ITicket, {}, {}>;
