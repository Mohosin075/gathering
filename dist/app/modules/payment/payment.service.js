"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentServices = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const payment_model_1 = require("./payment.model");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const payment_constants_1 = require("./payment.constants");
const mongoose_1 = require("mongoose");
const ticket_model_1 = require("../ticket/ticket.model");
const event_model_1 = require("../event/event.model");
const stripe_1 = __importDefault(require("../../../config/stripe"));
const config_1 = __importDefault(require("../../../config"));
const createCheckoutSession = async (user, // Replace with your JwtPayload type
payload) => {
    try {
        const ticket = await ticket_model_1.Ticket.findOne({
            _id: payload.ticketId,
            attendeeId: user.authId,
        }).populate('eventId');
        if (!ticket) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Ticket not found');
        }
        if (ticket.status === 'cancelled') {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Ticket is cancelled');
        }
        if (ticket.paymentStatus === 'paid') {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Ticket already paid');
        }
        const event = ticket.eventId;
        // Create Stripe Checkout Session
        const session = await stripe_1.default.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: payload.currency || 'usd',
                        product_data: {
                            name: `Ticket for ${event.title}`,
                            description: `Event: ${event.title} | Ticket Type: ${ticket.ticketType} | Quantity: ${ticket.quantity}`,
                            images: event.images && event.images.length > 0
                                ? [event.images[0]]
                                : [],
                        },
                        unit_amount: Math.round(ticket.finalAmount * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${config_1.default.clientUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${config_1.default.clientUrl}/payment/cancel`,
            customer_email: user.email,
            metadata: {
                ticketId: payload.ticketId,
                authId: user.authId,
                eventId: event._id.toString(),
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        });
        // Create payment record with consistent ID storage
        await payment_model_1.Payment.create({
            ticketId: payload.ticketId,
            userId: user.authId,
            userEmail: user.email,
            eventId: event._id,
            amount: ticket.finalAmount,
            currency: payload.currency || 'USD',
            paymentMethod: 'stripe',
            paymentIntentId: session.payment_intent || session.id, // Primary lookup field
            status: 'pending',
            metadata: {
                checkoutSessionId: session.id, // Secondary lookup field
                successUrl: session.success_url,
                cancelUrl: session.cancel_url,
                ticketId: payload.ticketId,
                authId: user.authId,
                eventId: event._id.toString(),
            },
        });
        return {
            sessionId: session.id,
            url: session.url,
        };
    }
    catch (error) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Checkout session creation failed: ${error.message}`);
    }
};
const verifyCheckoutSession = async (sessionId) => {
    try {
        // Retrieve session from Stripe
        const session = await stripe_1.default.checkout.sessions.retrieve(sessionId, {
            expand: ['payment_intent'],
        });
        // Find payment record
        const payment = await payment_model_1.Payment.findOne({ paymentIntentId: sessionId })
            .populate('ticketId')
            .populate('userId', 'name email')
            .populate('eventId', 'title startDate');
        if (!payment) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Payment not found');
        }
        // Update payment status based on session
        if (session.payment_status === 'paid' && payment.status !== 'succeeded') {
            const session = await payment_model_1.Payment.startSession();
            session.startTransaction();
            try {
                // Update payment status
                payment.status = 'succeeded';
                payment.metadata = { ...payment.metadata, session };
                await payment.save({ session });
                // Update ticket status
                await ticket_model_1.Ticket.findByIdAndUpdate(payment.ticketId, {
                    status: 'confirmed',
                    paymentStatus: 'paid',
                }, { session });
                // Update event tickets sold count
                const ticket = await ticket_model_1.Ticket.findById(payment.ticketId).session(session);
                if (ticket) {
                    await event_model_1.Event.findByIdAndUpdate(ticket.eventId, {
                        $inc: { ticketsSold: ticket.quantity },
                    }, { session });
                }
                await session.commitTransaction();
            }
            catch (error) {
                await session.abortTransaction();
                throw error;
            }
            finally {
                session.endSession();
            }
        }
        else if (session.payment_status === 'unpaid' &&
            payment.status !== 'failed') {
            payment.status = 'failed';
            await payment.save();
        }
        return payment;
    }
    catch (error) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Payment verification failed: ${error.message}`);
    }
};
const getAllPayments = async (user, filterables, pagination) => {
    const { searchTerm, ...filterData } = filterables;
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const andConditions = [];
    // Search functionality
    if (searchTerm) {
        andConditions.push({
            $or: payment_constants_1.paymentSearchableFields.map(field => ({
                [field]: {
                    $regex: searchTerm,
                    $options: 'i',
                },
            })),
        });
    }
    // Filter functionality
    if (Object.keys(filterData).length) {
        andConditions.push({
            $and: Object.entries(filterData).map(([key, value]) => ({
                [key]: value,
            })),
        });
    }
    // Regular users can only see their own payments
    if (user.role === 'user' || user.role === 'organizer') {
        andConditions.push({
            authId: new mongoose_1.Types.ObjectId(user.authId),
        });
    }
    const whereConditions = andConditions.length ? { $and: andConditions } : {};
    const [result, total] = await Promise.all([
        payment_model_1.Payment.find(whereConditions)
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate('ticketId')
            .populate('authId', 'name email')
            .populate('eventId', 'title startDate'),
        payment_model_1.Payment.countDocuments(whereConditions),
    ]);
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: result,
    };
};
const getSinglePayment = async (id) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Payment ID');
    }
    const result = await payment_model_1.Payment.findById(id)
        .populate('ticketId')
        .populate('authId', 'name email')
        .populate('eventId', 'title startDate');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested payment not found, please try again with valid id');
    }
    return result;
};
const updatePayment = async (id, payload) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Payment ID');
    }
    const result = await payment_model_1.Payment.findByIdAndUpdate(new mongoose_1.Types.ObjectId(id), { $set: payload }, {
        new: true,
        runValidators: true,
    })
        .populate('ticketId')
        .populate('authId', 'name email')
        .populate('eventId', 'title startDate');
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Requested payment not found, please try again with valid id');
    }
    return result;
};
const refundPayment = async (id, reason) => {
    if (!mongoose_1.Types.ObjectId.isValid(id)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid Payment ID');
    }
    const payment = await payment_model_1.Payment.findById(id);
    if (!payment) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Payment not found');
    }
    if (payment.status !== 'succeeded') {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Only successful payments can be refunded');
    }
    // Process refund via Stripe
    try {
        const refund = await stripe_1.default.refunds.create({
            payment_intent: payment.paymentIntentId,
            amount: Math.round(payment.amount * 100),
            reason: reason ? 'requested_by_customer' : 'duplicate',
        });
        const result = await payment_model_1.Payment.findByIdAndUpdate(id, {
            status: 'refunded',
            refundAmount: payment.amount,
            refundReason: reason,
            metadata: { ...payment.metadata, refundId: refund.id },
        }, { new: true, runValidators: true })
            .populate('ticketId')
            .populate('authId', 'name email')
            .populate('eventId', 'title startDate');
        // Update ticket status
        if (result) {
            await ticket_model_1.Ticket.findByIdAndUpdate(payment.ticketId, {
                status: 'refunded',
                paymentStatus: 'refunded',
            });
            // Update event tickets sold count
            const ticket = await ticket_model_1.Ticket.findById(payment.ticketId);
            if (ticket) {
                await event_model_1.Event.findByIdAndUpdate(ticket.eventId, {
                    $inc: { ticketsSold: -ticket.quantity },
                });
            }
        }
        return result;
    }
    catch (error) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, `Refund failed: ${error.message}`);
    }
};
const getMyPayments = async (user, pagination) => {
    const { page, skip, limit, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(pagination);
    const [result, total] = await Promise.all([
        payment_model_1.Payment.find({ authId: new mongoose_1.Types.ObjectId(user.authId) })
            .skip(skip)
            .limit(limit)
            .sort({ [sortBy]: sortOrder })
            .populate('ticketId')
            .populate('authId', 'name email')
            .populate('eventId', 'title startDate'),
        payment_model_1.Payment.countDocuments({ authId: new mongoose_1.Types.ObjectId(user.authId) }),
    ]);
    return {
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data: result,
    };
};
exports.PaymentServices = {
    getAllPayments,
    getSinglePayment,
    updatePayment,
    refundPayment,
    getMyPayments,
    createCheckoutSession,
    verifyCheckoutSession,
};
