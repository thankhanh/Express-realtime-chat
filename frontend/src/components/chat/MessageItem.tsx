import { cn, formatMessageTime } from "@/lib/utils";
import type { Conversation, Message, Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { EllipsisVertical, Reply, Trash2 } from "lucide-react";

interface MessageItemProps {
  message: Message;
  index: number;
  messages: Message[];
  selectedConvo: Conversation;
  lastMessageStatus: "delivered" | "seen";
  onReply: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onJumpToMessage?: (messageId: string) => void;
}

const MessageItem = ({
  message,
  index,
  messages,
  selectedConvo,
  lastMessageStatus,
  onReply,
  onDelete,
  onJumpToMessage,
}: MessageItemProps) => {
  const prev = index + 1 < messages.length ? messages[index + 1] : undefined;

  const isShowTime =
    index === 0 ||
    new Date(message.createdAt).getTime() -
      new Date(prev?.createdAt || 0).getTime() >
      300000; // 5 phút

  const isGroupBreak = isShowTime || message.senderId !== prev?.senderId;

  const participant = selectedConvo.participants.find(
    (p: Participant) => p._id.toString() === message.senderId.toString()
  );

  const replyPreview = message.replyTo;
  const hasImage = Boolean(message.imgUrl);
  const hasText = Boolean(message.content?.trim());
  const isImageOnly = hasImage && !hasText;

  const renderActionMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 rounded-full opacity-0 group-hover/message:opacity-100 data-[state=open]:opacity-100 transition-opacity"
        >
          <EllipsisVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={message.isOwn ? "end" : "start"}
        side={message.isOwn ? "left" : "right"}
      >
        <DropdownMenuItem onClick={() => onReply(message)}>
          <Reply className="size-4" />
          Trả lời tin nhắn
        </DropdownMenuItem>
        {message.isOwn && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => message._id && onDelete(message._id)}
          >
            <Trash2 className="size-4" />
            Thu hồi tin nhắn
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      {/* time */}
      {isShowTime && (
        <span className="flex justify-center text-xs text-muted-foreground px-1">
          {formatMessageTime(new Date(message.createdAt))}
        </span>
      )}

      <div
        id={message._id ? `message-${message._id}` : undefined}
        className={cn(
          "flex gap-2 message-bounce mt-1",
          message.isOwn ? "justify-end" : "justify-start"
        )}
      >
        {/* avatar */}
        {!message.isOwn && (
          <div className="w-8">
            {isGroupBreak && (
              <UserAvatar
                type="chat"
                name={participant?.displayName ?? "CCNLTHD"}
                avatarUrl={participant?.avatarUrl ?? undefined}
              />
            )}
          </div>
        )}

        <div
          className={cn(
            "group/message max-w-xs lg:max-w-md space-y-1 flex items-end gap-1",
            message.isOwn ? "flex-row" : "flex-row-reverse"
          )}
        >
          {!message.isDeleted && renderActionMenu()}

          {/* tin nhắn */}
          <div
            className={cn(
              "space-y-1 flex flex-col",
              message.isOwn ? "items-end" : "items-start"
            )}
          >
            <Card
              className={cn(
                isImageOnly ? "p-0 bg-transparent border-0 shadow-none" : hasImage ? "p-1" : "p-3",
                !isImageOnly &&
                  (message.isOwn ? "chat-bubble-sent border-0" : "chat-bubble-received")
              )}
            >
              {replyPreview && (
                <button
                  type="button"
                  onClick={() => replyPreview?._id && onJumpToMessage?.(replyPreview._id)}
                  className="mb-2 w-full text-left rounded-md border border-black/15 bg-black/10 px-2 py-1 text-xs hover:bg-black/15 transition"
                >
                  <p className="font-semibold text-foreground/95">Tin nhắn được trả lời</p>
                  <p className="font-medium text-foreground/85 break-words">
                    {replyPreview.isDeleted
                      ? "Tin nhắn đã bị thu hồi"
                      : replyPreview.content || "[Tin nhắn ảnh]"}
                  </p>
                </button>
              )}

              {message.isDeleted ? (
                <p className="text-sm italic text-muted-foreground">Tin nhắn đã bị thu hồi</p>
              ) : (
                <>
                  {hasImage && (
                    <img
                      src={message.imgUrl || ""}
                      alt="Hình ảnh tin nhắn"
                      className="max-w-[240px] md:max-w-[320px] max-h-[320px] rounded-md object-cover"
                      loading="lazy"
                    />
                  )}
                  {hasText && (
                    <p className={cn("text-sm leading-relaxed break-words", hasImage && "px-2 pb-2 pt-1")}>
                      {message.content}
                    </p>
                  )}
                </>
              )}
            </Card>

            {/* seen/ delivered */}
            {message.isOwn && message._id === selectedConvo.lastMessage?._id && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs px-1.5 py-0.5 h-4 border-0",
                  lastMessageStatus === "seen"
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {lastMessageStatus}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MessageItem;
