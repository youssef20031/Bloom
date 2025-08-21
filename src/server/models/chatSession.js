import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: String,
            enum: ['human', 'ai'],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        _id: false,
    }
);

const chatSessionSchema = new mongoose.Schema(
    {
        presalesUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            // --- THIS IS THE FIX ---
            required: true, // Changed from true to false
            index: true,
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            index: true,
        },
        sessionTitle: {
            type: String,
            required: true,
            trim: true,
            default: () => `Presales Call - ${new Date().toISOString().split('T')[0]}`,
        },
        messages: [messageSchema],
        status: {
            type: String,
            enum: ['active', 'completed'],
            default: 'active',
        },
    },
    {
        timestamps: true,
    }
);

const ChatSession = mongoose.models.ChatSession || mongoose.model('ChatSession', chatSessionSchema);

export default ChatSession;