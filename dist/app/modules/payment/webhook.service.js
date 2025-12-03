"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const http_status_codes_1 = require("http-status-codes");
const stripe_1 = __importDefault(require("../../../config/stripe"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const ticket_model_1 = require("../ticket/ticket.model");
const payment_model_1 = require("./payment.model");
const event_model_1 = require("../event/event.model");
const handleCheckoutSessionCompleted = async (sessionData) => {
    var _a;
    try {
        const sessionWithDetails = await stripe_1.default.checkout.sessions.retrieve(sessionData.id, {
            expand: ['payment_intent', 'line_items'],
        });
        let lookupId;
        if (typeof sessionWithDetails.payment_intent === 'string') {
            lookupId = sessionWithDetails.payment_intent;
        }
        else if ((_a = sessionWithDetails.payment_intent) === null || _a === void 0 ? void 0 : _a.id) {
            lookupId = sessionWithDetails.payment_intent.id;
        }
        else {
            lookupId = sessionWithDetails.id;
        }
        const mongoSession = await payment_model_1.Payment.startSession();
        mongoSession.startTransaction();
        try {
            // Find and lock the payment document
            const payment = await payment_model_1.Payment.findOne({
                $or: [
                    { paymentIntentId: lookupId },
                    { 'metadata.checkoutSessionId': sessionWithDetails.id },
                ],
            }).session(mongoSession);
            if (!payment) {
                throw new Error(`Payment not found for session: ${sessionWithDetails.id}`);
            }
            // Check if already processed to avoid duplicates
            if (payment.status === 'succeeded') {
                await mongoSession.commitTransaction();
                return;
            }
            // Update payment
            payment.status = 'succeeded';
            payment.metadata = { ...payment.metadata, ...sessionWithDetails };
            await payment.save({ session: mongoSession });
            // Update ticket
            await ticket_model_1.Ticket.findByIdAndUpdate(payment.ticketId, {
                status: 'confirmed',
                paymentStatus: 'paid',
            }, { session: mongoSession });
            // Update event tickets sold
            const ticket = await ticket_model_1.Ticket.findById(payment.ticketId).session(mongoSession);
            if (ticket) {
                await event_model_1.Event.findByIdAndUpdate(ticket.eventId, {
                    $inc: { ticketsSold: ticket.quantity },
                }, { session: mongoSession });
            }
            await mongoSession.commitTransaction();
            console.log(`Successfully processed payment for session: ${sessionWithDetails.id}`);
        }
        catch (error) {
            await mongoSession.abortTransaction();
            throw error;
        }
        finally {
            mongoSession.endSession();
        }
    }
    catch (error) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Checkout processing failed: ${error.message}`);
    }
};
const handleCheckoutSessionExpired = async (session) => {
    const mongoSession = await payment_model_1.Payment.startSession();
    mongoSession.startTransaction();
    try {
        const payment = await payment_model_1.Payment.findOne({
            $or: [
                { paymentIntentId: session.id },
                { 'metadata.checkoutSessionId': session.id },
            ],
        }).session(mongoSession);
        if (payment) {
            payment.status = 'failed';
            payment.metadata = { ...payment.metadata, ...session, expired: true };
            await payment.save({ session: mongoSession });
            await ticket_model_1.Ticket.findByIdAndUpdate(payment.ticketId, {
                paymentStatus: 'failed',
                status: 'cancelled',
            }, { session: mongoSession });
        }
        await mongoSession.commitTransaction();
    }
    catch (error) {
        await mongoSession.abortTransaction();
        throw error;
    }
    finally {
        mongoSession.endSession();
    }
};
const handlePaymentSuccess = async (paymentIntent) => {
    const mongoSession = await payment_model_1.Payment.startSession();
    mongoSession.startTransaction();
    console.log(paymentIntent);
    try {
        const payment = await payment_model_1.Payment.findOne({
            userEmail: paymentIntent.customer_email,
        }).session(mongoSession);
        if (!payment) {
            throw new Error(`${paymentIntent.id}`);
        }
        // Check if already processed
        if (payment.status === 'succeeded') {
            await mongoSession.commitTransaction();
            return;
        }
        // Update payment
        payment.status = 'succeeded';
        payment.paymentIntentId = paymentIntent.id;
        payment.metadata = { ...payment.metadata, ...paymentIntent };
        await payment.save({ session: mongoSession });
        // Update ticket
        await ticket_model_1.Ticket.findByIdAndUpdate(payment.ticketId, {
            status: 'confirmed',
            paymentStatus: 'paid',
        }, { session: mongoSession });
        // Update event
        const ticket = await ticket_model_1.Ticket.findById(payment.ticketId).session(mongoSession);
        if (ticket) {
            await event_model_1.Event.findByIdAndUpdate(ticket.eventId, {
                $inc: { ticketsSold: ticket.quantity },
            }, { session: mongoSession });
        }
        await mongoSession.commitTransaction();
        console.log(`Successfully processed payment intent: ${paymentIntent.id}`);
    }
    catch (error) {
        await mongoSession.abortTransaction();
        throw error;
    }
    finally {
        mongoSession.endSession();
    }
};
const handlePaymentFailure = async (paymentIntent) => {
    const mongoSession = await payment_model_1.Payment.startSession();
    mongoSession.startTransaction();
    try {
        const payment = await payment_model_1.Payment.findOne({
            paymentIntentId: paymentIntent.id,
        }).session(mongoSession);
        if (payment) {
            payment.status = 'failed';
            payment.metadata = { ...payment.metadata, ...paymentIntent };
            await payment.save({ session: mongoSession });
            await ticket_model_1.Ticket.findByIdAndUpdate(payment.ticketId, {
                paymentStatus: 'failed',
                status: 'cancelled',
            }, { session: mongoSession });
        }
        await mongoSession.commitTransaction();
    }
    catch (error) {
        await mongoSession.abortTransaction();
        throw error;
    }
    finally {
        mongoSession.endSession();
    }
};
exports.WebhookService = {
    handleWebhook: async (payload) => {
        try {
            const event = JSON.parse(payload.body.toString());
            console.log(`Processing webhook: ${event.type}`);
            switch (event.type) {
                case 'checkout.session.completed':
                    await handleCheckoutSessionCompleted(event.data.object);
                    break;
                case 'checkout.session.expired':
                    await handleCheckoutSessionExpired(event.data.object);
                    break;
                case 'payment_intent.succeeded':
                    await handlePaymentSuccess(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await handlePaymentFailure(event.data.object);
                    break;
                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }
        }
        catch (error) {
            console.error('Webhook processing error:', error);
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Webhook processing failed: ${error.message}`);
        }
    },
};
