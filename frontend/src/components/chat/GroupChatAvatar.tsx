import type { Participant } from "@/types/chat";
import UserAvatar from "./UserAvatar";

interface GroupChatAvatarProps {
  participants: Participant[];
  type: "chat" | "sidebar";
  groupAvatarUrl?: string; // the specific group avatar
}

const GroupChatAvatar = ({ participants, type, groupAvatarUrl }: GroupChatAvatarProps) => {
  // 1. If group has a dedicated avatar
  if (groupAvatarUrl) {
    return (
      <UserAvatar
        type={type}
        name="Group"
        avatarUrl={groupAvatarUrl}
      />
    );
  }

  // 2. Fallback to pile of participants (default behavior)
  const avatars = [];
  const limit = Math.min(participants.length, 3); // show up to 3 inside a group stack for cleaner look

  for (let i = 0; i < limit; i++) {
    const member = participants[i];
    avatars.push(
      <UserAvatar
        key={i}
        type={type}
        name={member.displayName}
        avatarUrl={member.avatarUrl ?? undefined}
      />
    );
  }

  return (
    <div className="relative flex -space-x-4 *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:ring-2">
      {avatars}

      {/* nếu nhiều hơn 3 thành viên thì hiện dấu + */}
      {participants.length > limit && (
        <div className="flex items-center z-10 justify-center size-8 rounded-full bg-muted ring-2 ring-background text-[10px] font-bold text-muted-foreground translate-x-1">
          +{participants.length - limit}
        </div>
      )}
    </div>
  );
};

export default GroupChatAvatar;
