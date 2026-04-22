import mongoose from "mongoose";

// Sub-schema cho thành viên
const participantSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        joinedAt: { type: Date, default: Date.now },
    },
    { _id: false } // không tạo _id riêng cho sub-document
);

// Sub-schema cho thông tin nhóm
const groupSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { _id: false }
);

// Sub-schema cho tin nhắn cuối cùng
const lastMessageSchema = new mongoose.Schema(
    {
        _id: { type: String },
        content: { type: String, default: null },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: null },
    },
    { _id: false }
);

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
        group: { type: groupSchema },
        lastMessageAt: { type: Date },
        seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        lastMessage: { type: lastMessageSchema, default: null },
        unreadCounts: { type: Map, of: Number, default: {} },
    },
    { timestamps: true }
);

// BÀI TẬP 1: Indexing
conversationSchema.index({ "participants.userId": 1, lastMessageAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
