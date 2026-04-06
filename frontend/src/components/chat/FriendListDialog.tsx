import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Users, MessageCircle, UserX, Loader2 } from "lucide-react";
import { useFriendStore } from "@/stores/useFriendStore";
import { useChatStore } from "@/stores/useChatStore";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

const FriendListDialog = () => {
  const [open, setOpen] = useState(false);
  const { friends, getFriends, loading } = useFriendStore();
  const { createConversation, conversations, setActiveConversation } = useChatStore();

  useEffect(() => {
    if (open) {
      getFriends();
    }
  }, [open, getFriends]);

  const handleStartChat = async (friendId: string) => {
    // Check if conversation already exists
    const existingConvo = conversations.find(
      (c) =>
        c.type === "direct" &&
        (c.participants as any).some((p: any) => 
          (p._id === friendId) || (p.userId?._id === friendId)
        )
    );

    if (existingConvo) {
      setActiveConversation(existingConvo._id);
      setOpen(false);
      return;
    }

    // Create new conversation
    await createConversation("direct", "", [friendId]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex justify-center items-center size-5 rounded-full hover:bg-sidebar-accent cursor-pointer z-10">
          <Users className="size-4" />
          <span className="sr-only">Danh sách bạn bè</span>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px] border-none p-0 overflow-hidden">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Bạn Bè ({friends.length})</DialogTitle>
          </DialogHeader>
        </div>

        <div className="max-h-96 overflow-y-auto beautiful-scrollbar px-3 pb-4">
          {loading && friends.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <UserX className="size-12 mb-3 opacity-20" />
              <p className="text-sm italic">Bạn chưa có người bạn nào 😭</p>
              <p className="text-xs mt-1">Gõ username ở nút bên cạnh để tìm bạn nhé!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {friends.map((friend) => (
                <div
                  key={friend._id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors group"
                >
                  <Avatar className="size-10 border border-border/50">
                    <AvatarImage src={friend.avatarUrl} alt={friend.displayName} />
                    <AvatarFallback className="bg-gradient-primary text-white text-sm font-bold">
                      {friend.displayName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{friend.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate italic">@{friend.username}</p>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartChat(friend._id)}
                    className="size-9 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                  >
                    <MessageCircle className="size-5" />
                    <span className="sr-only">Nhắn tin</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FriendListDialog;
