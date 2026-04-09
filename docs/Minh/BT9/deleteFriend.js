import Friend from "../../../backend/src/models/Friend.js";

// DELETE /api/friends/:friendId
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
