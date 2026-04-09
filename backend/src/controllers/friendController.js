import Friend from "../models/Friend.js";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import { io } from "../socket/index.js";

export const sendFriendRequest = async (req, res) => {
  try {
    const { to, message } = req.body;

    const from = req.user._id;

    if (from === to) {
      return res
        .status(400)
        .json({ message: "Không thể gửi lời mời kết bạn cho chính mình" });
    }

    const userExists = await User.exists({ _id: to });

    if (!userExists) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    let userA = from.toString();
    let userB = to.toString();

    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }

    const [alreadyFriends, existingRequest] = await Promise.all([
      Friend.findOne({ userA, userB }),
      FriendRequest.findOne({
        $or: [
          { from, to },
          { from: to, to: from },
        ],
      }),
    ]);

    if (alreadyFriends) {
      return res.status(400).json({ message: "Hai người đã là bạn bè" });
    }

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "Đã có lời mời kết bạn đang chờ" });
    }

    const request = await FriendRequest.create({
      from,
      to,
      message,
    });

    const sender = await User.findById(from)
      .select("_id username displayName avatarUrl")
      .lean();
    io.to(to.toString()).emit("new-friend-request", {
      request: {
        ...request.toObject(),
        from: sender,
      },
    });

    return res
      .status(201)
      .json({ message: "Gửi lời mời kết bạn thành công", request });
  } catch (error) {
    console.error("Lỗi khi gửi yêu cầu kết bạn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lời mời kết bạn" });
    }

    if (request.to.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền chấp nhận lời mời này" });
    }

    const friend = await Friend.create({
      userA: request.from,
      userB: request.to,
    });

    await FriendRequest.findByIdAndDelete(requestId);

    const from = await User.findById(request.from)
      .select("_id displayName avatarUrl username")
      .lean();

    const to = await User.findById(request.to)
      .select("_id displayName avatarUrl username")
      .lean();

    // Notify the sender that the request was accepted
    io.to(request.from.toString()).emit("friend-request-accepted", {
      newFriend: to,
    });

    return res.status(200).json({
      message: "Chấp nhận lời mời kết bạn thành công",
      newFriend: from,
    });
  } catch (error) {
    console.error("Lỗi khi chấp nhận lời mời kết bạn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const declineFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lời mời kết bạn" });
    }

    if (request.to.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền từ chối lời mời này" });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi từ chối lời mời kết bạn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getAllFriends = async (req, res) => {
  try {
    const userId = req.user._id;
    const search = (req.query.search || "").toString().trim().toLowerCase();

    const friendships = await Friend.find({
      $or: [
        {
          userA: userId,
        },
        {
          userB: userId,
        },
      ],
    })
      .populate("userA", "_id displayName avatarUrl username")
      .populate("userB", "_id displayName avatarUrl username")
      .lean();

    if (!friendships.length) {
      return res.status(200).json({ friends: [] });
    }

    const friends = friendships.map((f) =>
      f.userA._id.toString() === userId.toString() ? f.userB : f.userA,
    );

    const filteredFriends = search
      ? friends.filter((friend) =>
          (friend.displayName || "").toLowerCase().includes(search),
        )
      : friends;

    return res.status(200).json({ friends: filteredFriends });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bạn bè", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const populateFields = "_id username displayName avatarUrl";

    const [sent, received] = await Promise.all([
      FriendRequest.find({ from: userId }).populate("to", populateFields),
      FriendRequest.find({ to: userId }).populate("from", populateFields),
    ]);

    res.status(200).json({ sent, received });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách yêu cầu kết bạn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const cancelFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lời mời kết bạn" });
    }

    // Chỉ người gửi mới được hủy lời mời đã gửi
    if (request.from.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền hủy lời mời này" });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi hủy lời mời kết bạn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const deleteFriend = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { friendId } = req.params;

    let userA = userId;
    let userB = friendId.toString();

    // Chuẩn hóa thứ tự giống pre-save hook: userA < userB
    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }

    const deletedFriend = await Friend.findOneAndDelete({ userA, userB });

    if (!deletedFriend) {
      return res.status(404).json({ message: "Không tìm thấy quan hệ bạn bè" });
    }

    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi xóa bạn bè", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getRelationshipStatus = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { targetUserId } = req.params;

    if (userId === targetUserId) {
      return res.status(200).json({ status: "none" });
    }

    let userA = userId;
    let userB = targetUserId.toString();

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
