import FriendRequest from "../../../backend/src/models/FriendRequest.js";

// DELETE /api/friends/requests/:requestId/cancel
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
