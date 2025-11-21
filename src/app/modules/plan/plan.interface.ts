import { Model } from 'mongoose'

export type IPlan = {
  title: String
  description: String
  features: string[]
  limits: {
    session: number
  }
  priceId?: String
  price: Number
  duration: '1 month' | '3 months' | '6 months' | '1 year' | 'One Time'
  paymentType: 'Monthly' | 'Yearly' | 'One Time'
  productId?: String
  paymentLink?: string
  status: 'active' | 'Delete'
}

export type PlanModel = Model<IPlan, Record<string, unknown>>
