import { useState, useRef } from "react";
import {  
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  UserPlus, 
  Camera, 
  Edit3, 
  Trash2, 
  LogOut, 
  Loader2, 
  Check, 
  X 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFriendStore } from "@/stores/useFriendStore";
import { useEffect } from "react";
import type { Conversation } from "@/types/chat";
import { chatService } from "@/services/chatService";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";

interface GroupInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: Conversation;
}

const GroupInfoDialog = ({ open, onOpenChange, conversation }: GroupInfoDialogProps) => {
  const { user: currentUser } = useAuthStore();
  const { fetchConversations } = useChatStore();
  const { friends, getFriends } = useFriendStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState(conversation.group?.name || "");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      getFriends();
    }
  }, [open, getFriends]);

  const isAdmin = conversation.group?.createdBy === currentUser?._id;

  const handleAddMember = async (friendId: string) => {
    try {
      await chatService.addGroupMembers(conversation._id, [friendId]);
      toast.success("Đã thêm thành viên mới");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Thêm thành viên thất bại");
    }
  };

  const handleUpdateName = async () => {
    if (!groupName.trim() || groupName === conversation.group?.name) {
      setIsEditingName(false);
      return;
    }
    setLoading(true);
    try {
      await chatService.updateGroupInfo(conversation._id, { name: groupName.trim() });
      toast.success("Đã cập nhật tên nhóm");
      setIsEditingName(false);
      // Realtime update is handled by socket, but we can refresh just in case
    } catch (error) {
      toast.error("Cập nhật tên nhóm thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      await chatService.uploadGroupAvatar(conversation._id, file);
      toast.success("Đã cập nhật ảnh đại diện nhóm");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Cập nhật ảnh đại diện thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Bạn có muốn rời khỏi nhóm này không?")) return;
    try {
      await chatService.leaveGroup(conversation._id);
      toast.success("Đã rời nhóm");
      onOpenChange(false);
      fetchConversations();
    } catch (error) {
      toast.error("Rời nhóm thất bại");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!isAdmin) return;
    if (!confirm(`Xóa ${memberName} khỏi nhóm?`)) return;

    try {
      await chatService.removeGroupMember(conversation._id, memberId);
      toast.success(`Đã xóa ${memberName}`);
    } catch (error) {
      toast.error("Xóa thành viên thất bại");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto glass-strong border-border/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Thông tin nhóm
          </DialogTitle>
          <DialogDescription>
            Quản lý thông tin và thành viên nhóm chat
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Group Avatar Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <Avatar className="size-24 border-4 border-background shadow-xl ring-2 ring-primary/20 bg-white">
                <AvatarImage src={conversation.group?.avatarUrl} />
                <AvatarFallback className="bg-white text-primary text-xl font-bold">
                  {conversation.group?.name?.charAt(0) || "G"}
                </AvatarFallback>
              </Avatar>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                disabled={loading}
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarUpload}
              />
            </div>

            {/* Group Name Section */}
            <div className="w-full flex items-center justify-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-1 w-full max-w-[250px]">
                  <Input 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="h-8 text-center"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                  />
                  <Button size="icon" variant="ghost" className="size-8 text-green-500" onClick={handleUpdateName} disabled={loading}>
                    <Check className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="size-8 text-destructive" onClick={() => { setIsEditingName(false); setGroupName(conversation.group?.name || ""); }}>
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">{conversation.group?.name}</h3>
                  <button onClick={() => setIsEditingName(true)} className="p-1 text-muted-foreground hover:text-primary">
                    <Edit3 className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                Thành viên ({conversation.participants.length})
              </h4>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-primary font-medium hover:bg-primary/10">
                    <UserPlus className="size-3 mr-1" /> Thêm
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-60 overflow-y-auto z-50 bg-background border border-border shadow-lg">
                  {friends.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center min-w-[200px]">Bạn chưa có bạn bè để thêm</div>
                  ) : (
                    <>
                      {friends
                        .filter(f => !conversation.participants.some(p => p._id === f._id))
                        .map(friend => (
                          <DropdownMenuItem key={friend._id} onClick={() => handleAddMember(friend._id)}>
                            <Avatar className="size-6 mr-2">
                              <AvatarImage src={friend.avatarUrl ?? undefined} />
                              <AvatarFallback className="text-[10px] bg-primary text-white font-bold">{friend.displayName?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {friend.displayName}
                          </DropdownMenuItem>
                        ))}
                      {friends.filter(f => !conversation.participants.some(p => p._id === f._id)).length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground text-center min-w-[200px]">Tất cả bạn bè đã ở trong nhóm</div>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {conversation.participants.map((member) => (
                <div key={member._id} className="flex items-center justify-between group/member p-2 rounded-lg hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarImage src={member.avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-gradient-primary text-white text-xs font-bold">
                        {member.displayName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium flex items-center gap-1.5">
                        {member.displayName}
                        {member._id === conversation.group?.createdBy && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase">Admin</span>
                        )}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Tham gia: {new Date(member.joinedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {isAdmin && member._id !== currentUser?._id && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-8 text-muted-foreground hover:text-destructive opacity-0 group-hover/member:opacity-100 transition-opacity"
                      onClick={() => handleRemoveMember(member._id, member.displayName)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-border/30">
            <Button 
              variant="destructive" 
              className="w-full justify-start gap-2 h-10 bg-destructive/5 hover:bg-destructive text-destructive hover:text-white border border-destructive/20"
              onClick={handleLeaveGroup}
            >
              <LogOut className="size-4" />
              Rời khỏi nhóm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupInfoDialog;
