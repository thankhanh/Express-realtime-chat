import express from "express";

import {
  acceptFriendRequest,
  sendFriendRequest,
  declineFriendRequest,
  getAllFriends,
  getFriendRequests,
  cancelFriendRequest,
  deleteFriend,
  getRelationshipStatus,
  getMutualFriends,
} from "../controllers/friendController.js";

const router = express.Router();

router.post("/requests", sendFriendRequest);

router.post("/requests/:requestId/accept", acceptFriendRequest);
router.post("/requests/:requestId/decline", declineFriendRequest);
router.post("/requests/:requestId/cancel", cancelFriendRequest);

router.get("/", getAllFriends);
router.get("/requests", getFriendRequests);
router.get("/status/:targetUserId", getRelationshipStatus);
router.get("/mutual/:targetUserId", getMutualFriends);
router.delete("/:friendId", deleteFriend);

export default router;
