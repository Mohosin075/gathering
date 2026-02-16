"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatSocketHelper = void 0;
const getIO = () => global.io;
const broadcastMessage = (roomId, message) => {
    const io = getIO();
    if (io) {
        console.log(`Broadcasting new-message to room:${roomId}`);
        io.to(`room:${roomId}`).emit('new-message', message);
    }
    else {
        console.error('Socket.io instance not found in global scope');
    }
};
const broadcastLike = (roomId, messageId, userId) => {
    const io = getIO();
    if (io) {
        io.to(`room:${roomId}`).emit('message-liked', {
            messageId,
            userId,
        });
    }
};
const broadcastDelete = (roomId, messageId) => {
    const io = getIO();
    if (io) {
        io.to(`room:${roomId}`).emit('message-deleted', {
            messageId,
        });
    }
};
exports.ChatSocketHelper = {
    broadcastMessage,
    broadcastLike,
    broadcastDelete,
};
