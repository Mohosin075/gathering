"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const notificationsHelper_1 = require("../../../helpers/notificationsHelper");
const message_model_1 = require("./message.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const user_model_1 = require("../user/user.model");
const sendMessageToDB = async (payload) => {
    console.log(payload);
    if (!mongoose_1.default.Types.ObjectId.isValid(payload.receiver)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid Receiver ID");
    }
    const sender = await user_model_1.User.findById(payload.sender).select("name");
    // save to DB
    const response = await message_model_1.Message.create(payload);
    //@ts-ignore
    const io = global.io;
    if (io) {
        io.emit(`getMessage::${payload === null || payload === void 0 ? void 0 : payload.chatId}`, response);
        const data = {
            text: `${sender === null || sender === void 0 ? void 0 : sender.name} send you message.`,
            title: "Received Message",
            link: payload === null || payload === void 0 ? void 0 : payload.chatId,
            direction: "message",
            receiver: payload.receiver
        };
        await (0, notificationsHelper_1.sendNotifications)(data);
    }
    return response;
};
const getMessageFromDB = async (id) => {
    const messages = await message_model_1.Message.find({ chatId: id })
        .sort({ createdAt: -1 });
    return messages;
};
exports.MessageService = { sendMessageToDB, getMessageFromDB };
