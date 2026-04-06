import { Info, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { useChatStore } from "@/stores/useChatStore";
import type { Conversation } from "@/types/chat";
import { SidebarTrigger } from "../ui/sidebar";
import { useAuthStore } from "@/stores/useAuthStore";
import { Separator } from "../ui/separator";
import UserAvatar from "./UserAvatar";
import StatusBadge from "./StatusBadge";
import GroupChatAvatar from "./GroupChatAvatar";
import { useSocketStore } from "@/stores/useSocketStore";
import GroupInfoDialog from "@/components/chat/GroupInfoDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const ChatWindowHeader = ({ chat }: { chat?: Conversation }) => {
  const { conversations, activeConversationId } = useChatStore();
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const [showInfo, setShowInfo] = useState(false);

  let otherUser;

  chat = chat ?? conversations.find((c: Conversation) => c._id === activeConversationId);

  if (!chat) {
    return (
      <header className="md:hidden sticky top-0 z-10 flex items-center gap-2 px-4 py-2 w-full">
        <SidebarTrigger className="-ml-1 text-foreground" />
      </header>
    );
  }

  if (chat.type === "direct") {
    const otherUsers = chat.participants.filter((p: any) => p._id !== user?._id);
    otherUser = otherUsers.length > 0 ? otherUsers[0] : null;

    if (!user || !otherUser) return null;
  }

  return (
    <header className="sticky top-0 z-10 px-4 py-2 flex items-center bg-background border-b border-border/40">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1 text-foreground" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          <div className="flex items-center gap-3">
            {/* avatar */}
            <div className="relative">
              {chat.type === "direct" ? (
                <>
                  <UserAvatar
                    type={"sidebar"}
                    name={otherUser?.displayName || "CCNLTHD"}
                    avatarUrl={otherUser?.avatarUrl || undefined}
                  />
                  <StatusBadge
                    status={
                      onlineUsers.includes(otherUser?._id ?? "") ? "online" : "offline"
                    }
                  />
                </>
              ) : (
                <GroupChatAvatar
                  groupAvatarUrl={chat.group?.avatarUrl}
                  participants={chat.participants}
                  type="sidebar"
                />
              )}
            </div>

            {/* name */}
            <div className="flex flex-col">
              <h2 className="font-semibold text-foreground leading-tight">
                {chat.type === "direct" ? otherUser?.displayName : chat.group?.name}
              </h2>
              {chat.type === "group" && (
                <p className="text-[10px] text-muted-foreground">
                  {chat.participants.length} thành viên
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {chat.type === "group" && (
                <DropdownMenuItem onClick={() => setShowInfo(true)}>
                  <Info className="size-4 mr-2" />
                  Thông tin nhóm
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => {
                  if (confirm("Bạn có chắc muốn xóa cuộc trò chuyện này?")) {
                    useChatStore.getState().deleteConversation(chat!._id);
                  }
                }}
              >
                <Trash2 className="size-4 mr-2" />
                Xóa cuộc trò chuyện
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {chat.type === "group" && (
        <GroupInfoDialog
          open={showInfo}
          onOpenChange={setShowInfo}
          conversation={chat}
        />
      )}
    </header>
  );
};

export default ChatWindowHeader;
