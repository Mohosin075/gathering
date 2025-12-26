"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatSocketHelper = void 0;
const getIO = () => global.io;
const broadcastMessage = (streamId, message) => {
    const io = getIO();
    if (io) {
        console.log(`Broadcasting new-message to stream:${streamId}`);
        io.to(`stream:${streamId}`).emit('new-message', message);
    }
    else {
        console.error('Socket.io instance not found in global scope');
    }
};
const broadcastLike = (streamId, messageId, userId) => {
    const io = getIO();
    if (io) {
        io.to(`stream:${streamId}`).emit('message-liked', {
            messageId,
            userId,
        });
    }
};
const broadcastDelete = (streamId, messageId) => {
    const io = getIO();
    if (io) {
        io.to(`stream:${streamId}`).emit('message-deleted', {
            messageId,
        });
    }
};
exports.ChatSocketHelper = {
    broadcastMessage,
    broadcastLike,
    broadcastDelete,
};
