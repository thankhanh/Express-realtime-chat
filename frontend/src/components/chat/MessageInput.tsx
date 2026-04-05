import { useAuthStore } from "@/stores/useAuthStore";
import type { Conversation } from "@/types/chat";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { ImagePlus, Send, X } from "lucide-react";
import { Input } from "../ui/input";
import EmojiPicker from "./EmojiPicker";
import { useChatStore } from "@/stores/useChatStore";
import { toast } from "sonner";

const MessageInput = ({ selectedConvo }: { selectedConvo: Conversation }) => {
  const { user } = useAuthStore();
  const {
    sendDirectMessage,
    sendGroupMessage,
    sendImageMessage,
    replyingMessage,
    clearReplyingMessage,
  } = useChatStore();
  const [value, setValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return;

  const sendMessage = async () => {
    if (!value.trim()) return;
    const currValue = value;
    const replyToId = replyingMessage?._id;
    setValue("");

    try {
      if (selectedConvo.type === "direct") {
        const participants = selectedConvo.participants;
        const otherUser = participants.filter((p) => p._id !== user._id)[0];
        await sendDirectMessage(otherUser._id, currValue, undefined, replyToId);
      } else {
        await sendGroupMessage(selectedConvo._id, currValue, undefined, replyToId);
      }

      clearReplyingMessage();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi gửi tin nhắn. Bạn hãy thử lại!");
    }
  };

  useEffect(() => {
    clearReplyingMessage();
  }, [clearReplyingMessage, selectedConvo._id]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleSelectImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      if (selectedConvo.type === "direct") {
        const participants = selectedConvo.participants;
        const otherUser = participants.filter((p) => p._id !== user._id)[0];
        await sendImageMessage(file, selectedConvo._id, otherUser?._id);
      } else {
        await sendImageMessage(file, selectedConvo._id);
      }
    } catch (error) {
      console.error(error);
      toast.error("Không thể gửi ảnh. Bạn hãy thử lại!");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="p-3 bg-background">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSelectImage}
      />

      {replyingMessage && (
        <div className="mb-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-primary">Đang trả lời</p>
              <p className="text-xs text-muted-foreground break-words">
                {replyingMessage.isDeleted
                  ? "Tin nhắn đã bị thu hồi"
                  : replyingMessage.content || "[Tin nhắn ảnh]"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={clearReplyingMessage}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 min-h-[56px]">
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-primary/10 transition-smooth"
        onClick={handleOpenFilePicker}
      >
        <ImagePlus className="size-4" />
      </Button>

      <div className="flex-1 relative">
        <Input
          onKeyPress={handleKeyPress}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Soạn tin nhắn..."
          className="pr-20 h-9 bg-white border-border/50 focus:border-primary/50 transition-smooth resize-none"
        ></Input>
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-8 hover:bg-primary/10 transition-smooth"
          >
            <div>
              <EmojiPicker
                onChange={(emoji: string) => setValue(`${value}${emoji}`)}
              />
            </div>
          </Button>
        </div>
      </div>

      <Button
        onClick={sendMessage}
        className="bg-gradient-chat hover:shadow-glow transition-smooth hover:scale-105"
        disabled={!value.trim()}
      >
        <Send className="size-4 text-white" />
      </Button>
      </div>
    </div>
  );
};

export default MessageInput;
