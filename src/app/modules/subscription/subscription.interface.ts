import { Date, Model, Types } from 'mongoose'

export type ISubscription = {
  _id?: string
  customerId: string
  price: number
  user: Types.ObjectId
  plan: Types.ObjectId
  trxId: string
  subscriptionId: string
  status: 'expired' | 'active' | 'cancel'
  currentPeriodStart: string
  currentPeriodEnd: string

  usage: {
    session: number
  }
  lastReset: Date
}

export type SubscriptionModel = Model<ISubscription, Record<string, unknown>>
