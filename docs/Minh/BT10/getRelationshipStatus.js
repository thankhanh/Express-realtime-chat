import Friend from "../../../backend/src/models/Friend.js";
import FriendRequest from "../../../backend/src/models/FriendRequest.js";

// GET /api/friends/status/:targetUserId
export const getRelationshipStatus = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { targetUserId } = req.params;

    if (userId === targetUserId) {
      return res.status(200).json({ status: "none" });
    }

    let userA = userId;
    let userB = targetUserId.toString();

    // Chuẩn hóa thứ tự để kiểm tra Friend giống pre-save hook
    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }

    const [friendship, sentRequest, receivedRequest] = await Promise.all([
      Friend.findOne({ userA, userB }).select("_id").lean(),
      FriendRequest.findOne({ from: userId, to: targetUserId })
        .select("_id")
        .lean(),
      FriendRequest.findOne({ from: targetUserId, to: userId })
        .select("_id")
        .lean(),
    ]);

    if (friendship) {
      return res.status(200).json({ status: "friend" });
    }

    if (sentRequest) {
      return res.status(200).json({ status: "request_sent" });
    }

    if (receivedRequest) {
      return res.status(200).json({ status: "request_received" });
    }

    return res.status(200).json({ status: "none" });
  } catch (error) {
    console.error("Lỗi khi lấy trạng thái quan hệ", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
