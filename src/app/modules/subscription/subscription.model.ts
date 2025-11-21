import { model, Schema } from 'mongoose'
import { ISubscription, SubscriptionModel } from './subscription.interface'

const subscriptionSchema = new Schema<ISubscription, SubscriptionModel>(
  {
    customerId: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },

    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    trxId: {
      type: String,
      required: false,
    },
    subscriptionId: {
      type: String,
    },
    currentPeriodStart: {
      type: String,
      required: true,
    },
    currentPeriodEnd: {
      type: String,
      required: true,
    },

    // Track usage against plan limits
    usage: {
      session: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['expired', 'active', 'cancel'],
      default: 'active',
      required: true,
    },
    lastReset: {
      type: Date,
      default: Date.now,
    },
  },

  {
    timestamps: true,
  },
)

export const Subscription = model<ISubscription, SubscriptionModel>(
  'Subscription',
  subscriptionSchema,
)
