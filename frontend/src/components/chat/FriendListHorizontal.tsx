import { useEffect } from "react";
import { useFriendStore } from "@/stores/useFriendStore";
import { useChatStore } from "@/stores/useChatStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

const FriendListHorizontal = () => {
  const { friends, getFriends, loading } = useFriendStore();
  const { createConversation, conversations, setActiveConversation } = useChatStore();
  const { onlineUsers } = useSocketStore();

  useEffect(() => {
    getFriends();
  }, [getFriends]);

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
      return;
    }

    // Create new conversation
    await createConversation("direct", "", [friendId]);
  };

  if (loading && friends.length === 0) {
    return (
      <div className="flex flex-col gap-2 py-2">
        <Skeleton className="h-4 w-24 ml-1" />
        <div className="flex gap-4 px-2 py-1 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
              <Skeleton className="size-12 rounded-full" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (friends.length === 0) return null;

  return (
    <div className="py-2 flex flex-col gap-2.5">
      <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-1">
        Danh sách bạn bè ({friends.length})
      </h3>
      <div className="flex w-full overflow-x-auto beautiful-scrollbar select-none gap-4 p-1">
        <TooltipProvider delayDuration={0}>
          {friends.map((friend) => {
            const isOnline = onlineUsers.includes(friend._id);
            return (
              <Tooltip key={friend._id}>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => handleStartChat(friend._id)}
                    className="flex flex-col items-center gap-1.5 transition-smooth hover:scale-110 active:scale-95 group flex-shrink-0 cursor-pointer"
                  >
                    <div className="relative">
                      <Avatar className={`size-12 ring-2 ${isOnline ? 'ring-green-500/20 group-hover:ring-green-500/40' : 'ring-background group-hover:ring-primary/40'} transition-all border border-border/50 shadow-sm`}>
                        <AvatarImage src={friend.avatarUrl} alt={friend.displayName} className="object-cover" />
                        <AvatarFallback className="bg-gradient-primary text-white text-base font-bold uppercase">
                          {friend.displayName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Status indicator dot */}
                      <span className={`absolute bottom-0 right-0.5 size-3.5 rounded-full border-2 border-background shadow-sm ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    </div>
                    <span className={`text-[10px] font-medium max-w-[60px] truncate transition-colors ${isOnline ? 'text-foreground font-semibold' : 'text-foreground/70'}`}>
                      {friend.displayName.split(' ').pop()}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <p className="font-semibold">{friend.displayName} {isOnline ? '(Online)' : '(Offline)'}</p>
                  </div>
                  <p className="text-[10px] opacity-70 ml-4">@{friend.username}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
};

export default FriendListHorizontal;
