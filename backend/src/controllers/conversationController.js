import getConversations from "../models/Conversation.js";
import Message from "../models/Message.js";

export const createConversation = async (req, res) => {
  try{
    const {type, name, memberIds} = req.body;
    const userId = req.user._id;

    if(!type || (type === "group" && !name) || !memberIds || !Array.isArray(memberIds) || !memberIds.length === 0){
        return res.status(400).json({message: "Tên nhóm và danh sách thành viên là bắt buộc"});

    }

    let conversation;

    if (type === 'direct'){
        const participantId = memberIds[0];

        conversation = await conversation.findOne({ type: 'direct', "participants.userId": {$all: [userId, participantId]}});

        if(!conversation){
            conversation = new Conversation({
                type: "direct",
                participants: [{userId}, {userId: participantId}],
                lastMessage: new Date(),
            });
        }
    }

  }catch(error){

  }
};

export const getConversations = async (req, res) => {};

export const getMessage = async (req, res) => {};