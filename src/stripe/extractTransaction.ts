import Stripe from 'stripe'

export type ExtractedTransaction = {
  paymentIntentId: string
  chargeId: string
  amountPaid: number // USD
}

// Expand an invoice when provided as an ID string
export const expandInvoiceIfNeeded = async (
  stripeClient: Stripe,
  invoiceLike: string | Stripe.Invoice | null,
) => {
  if (!invoiceLike) return null
  if (typeof invoiceLike === 'string') {
    return (await stripeClient.invoices.retrieve(invoiceLike, {
      expand: ['payment_intent', 'charge'],
    })) as Stripe.Invoice
  }
  return invoiceLike
}

export const extractFromInvoice = (
  invoice: Stripe.Invoice | null,
): ExtractedTransaction => {
  if (!invoice) return { paymentIntentId: '', chargeId: '', amountPaid: 0 }

  let paymentIntentId = ''
  let chargeId = ''

  const pi = (invoice as any).payment_intent
  paymentIntentId = typeof pi === 'string' ? pi : pi?.id ?? ''

  const ch = (invoice as any).charge
  chargeId = typeof ch === 'string' ? ch : ch?.id ?? ''

  const amountPaid = ((invoice as any).amount_paid || 0) / 100

  return { paymentIntentId, chargeId, amountPaid }
}

export const extractFromSubscription = async (
  stripeClient: Stripe,
  subscription: Stripe.Subscription,
): Promise<ExtractedTransaction> => {
  const invoice = await expandInvoiceIfNeeded(
    stripeClient,
    subscription.latest_invoice,
  )
  return extractFromInvoice(invoice)
}

export const extractFromCheckoutSession = async (
  stripeClient: Stripe,
  session: Stripe.Checkout.Session,
): Promise<ExtractedTransaction> => {
  let paymentIntentId = ''
  let chargeId = ''
  let amountPaid = 0

  const piFromSession = (session as any).payment_intent
  paymentIntentId =
    typeof piFromSession === 'string' ? piFromSession : piFromSession?.id ?? ''

  if (paymentIntentId) {
    const pi = await stripeClient.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge'],
    })
    const latestCharge = (pi as any).latest_charge
    chargeId = typeof latestCharge === 'string' ? latestCharge : latestCharge?.id ?? ''
    amountPaid = ((pi as any).amount_received || 0) / 100
  }

  return { paymentIntentId, chargeId, amountPaid }
}