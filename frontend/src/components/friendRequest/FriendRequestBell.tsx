import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import FriendRequestDialog from "./FriendRequestDialog";
import { useFriendStore } from "@/stores/useFriendStore";

const FriendRequestBell = () => {
  const [open, setOpen] = useState(false);
  const { receivedList, getAllFriendRequests } = useFriendStore();

  useEffect(() => {
    // Tải danh sách yêu cầu kết bạn lần đầu để hiện badge đỏ nếu có
    getAllFriendRequests();
  }, []);

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="relative flex items-center justify-center p-1.5 rounded-full hover:bg-white/20 transition-colors"
        title="Thông báo kết bạn"
      >
        <Bell className="size-4 text-white/80" />
        {receivedList.length > 0 && (
          <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>
      
      <FriendRequestDialog open={open} setOpen={setOpen} />
    </>
  );
};

export default FriendRequestBell;
