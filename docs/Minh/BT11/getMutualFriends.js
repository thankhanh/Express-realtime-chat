import Friend from "../../../backend/src/models/Friend.js";
import User from "../../../backend/src/models/User.js";

const getFriendIds = async (userId) => {
  const friendships = await Friend.find({
    $or: [{ userA: userId }, { userB: userId }],
  })
    .select("userA userB")
    .lean();

  return friendships.map((f) =>
    f.userA.toString() === userId.toString()
      ? f.userB.toString()
      : f.userA.toString(),
  );
};

// GET /api/friends/mutual/:targetUserId
export const getMutualFriends = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.params;

    const targetExists = await User.exists({ _id: targetUserId });

    if (!targetExists) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const [myFriendIds, targetFriendIds] = await Promise.all([
      getFriendIds(userId),
      getFriendIds(targetUserId),
    ]);

    if (!myFriendIds.length || !targetFriendIds.length) {
      return res.status(200).json({ mutualFriends: [] });
    }

    const targetFriendSet = new Set(targetFriendIds);
    const mutualIds = myFriendIds.filter((id) => targetFriendSet.has(id));

    if (!mutualIds.length) {
      return res.status(200).json({ mutualFriends: [] });
    }

    const mutualFriends = await User.find({ _id: { $in: mutualIds } })
      .select("_id displayName avatarUrl username")
      .lean();

    return res.status(200).json({ mutualFriends });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bạn chung", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
