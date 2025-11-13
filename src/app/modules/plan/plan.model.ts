import { model, Schema } from 'mongoose'
import { IPlan, PlanModel } from './plan.interface'

const planSchema = new Schema<IPlan, PlanModel>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    features: {
      type: [String],
      required: true,
    },
    limits: {
      session: {
        type: Number,
        required: true,
        default: 0,
      },
    },
    priceId: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
      enum: ['1 month', '3 months', '6 months', '1 year', 'One Time'],
      required: true,
    },
    paymentType: {
      type: String,
      enum: ['Monthly', 'Yearly', 'One Time'],
      required: true,
    },
    productId: {
      type: String,
    },
    paymentLink: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'Delete'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  },
)

export const Plan = model<IPlan, PlanModel>('Plan', planSchema)
