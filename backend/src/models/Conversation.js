import mongoose from "mongoose";
//Người tham gia cuộc trò chuyện
const participantSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        _id: false,
    }
);
//Thông tin nhóm trong cuộc trò chuyện nhóm
const groupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        avatarUrl: {
            type: String,
            default: "https://via.placeholder.com/150/FFFFFF/000000?text=GROUP",
        },
        avatarId: {
            type: String,
        },
    },
    {
        _id: false,
    }
);
//Khai báo schema cho tin nhắn cuối cùng trong cuộc trò chuyện
const lastMessageSchema = new mongoose.Schema(
    {
        _id: { type: String },
        content: {
            type: String,
            default: null,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        createdAt: {
            type: Date,
            default: null,
        },
    },
    {
        _id: false,
    }
);
//Khai báo schema cho cuộc trò chuyện
const conversationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["direct", "group"],
            required: true,
        },
        participants: {
            type: [participantSchema],
            required: true,
        },
        group: {
            type: groupSchema,
        },
        lastMessageAt: {
            type: Date,
        },
        seenBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        lastMessage: {
            type: lastMessageSchema,
            default: null,
        },
        unreadCounts: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

conversationSchema.index({
    "participants.userId": 1,
    lastMessageAt: -1,
});

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;