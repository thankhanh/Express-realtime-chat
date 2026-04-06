import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { UserPlus, Search, Loader2 } from "lucide-react";
import type { User } from "@/types/user";
import { useFriendStore } from "@/stores/useFriendStore";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

const AddFriendModal = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const { searchByUsername, addFriend, friends, sentList, getAllFriendRequests } = useFriendStore();

  const getFriendshipStatus = (userId: string) => {
    if (friends.some((f) => f._id === userId)) return "friend";
    if (sentList.some((s) => s.to?._id === userId)) return "sent";
    return "none";
  };

  // Debounce tìm kiếm khi nhập
  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);

      if (!val.trim()) {
        setResults([]);
        return;
      }

      setSearching(true);
      try {
        const users = await searchByUsername(val.trim());
        setResults(users ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [searchByUsername]
  );

  const handleAddFriend = async (user: User) => {
    if (getFriendshipStatus(user._id) !== "none") return;

    setSendingId(user._id);
    try {
      const message = await addFriend(user._id);
      toast.success(message || "Gửi yêu cầu kết bạn thành công! 🎉");
      // Cập nhật lại danh sách yêu cầu đã gửi
      await getAllFriendRequests();
    } catch (error: any) {
      toast.error(error.message || "Lỗi xảy ra khi gửi kết bạn. Hãy thử lại");
    } finally {
      setSendingId(null);
    }
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) {
      setQuery("");
      setResults([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div className="flex justify-center items-center size-5 rounded-full hover:bg-sidebar-accent cursor-pointer z-10">
          <UserPlus className="size-4" />
          <span className="sr-only">Kết bạn</span>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[420px] border-none p-0 overflow-hidden">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Kết Bạn</DialogTitle>
          </DialogHeader>

          {/* Search input */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={handleChange}
              placeholder="Nhập username để tìm bạn bè..."
              className="pl-9 pr-4 glass border-border/50 focus:border-primary/50 transition-all"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-primary" />
            )}
          </div>
        </div>

        {/* Results list */}
        <div className="max-h-72 overflow-y-auto beautiful-scrollbar px-3 pb-4">
          {!query.trim() && (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <UserPlus className="size-10 mb-2 opacity-30" />
              <p className="text-sm">Gõ username để tìm bạn bè</p>
            </div>
          )}

          {query.trim() && !searching && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <span className="text-3xl mb-2">🔍</span>
              <p className="text-sm">
                Không tìm thấy người dùng nào với{" "}
                <span className="font-semibold text-foreground">"{query}"</span>
              </p>
            </div>
          )}

          {results.map((user) => (
            <div
              key={user._id}
              className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-accent/50 transition-colors group"
            >
              <Avatar className="size-9 shrink-0">
                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                <AvatarFallback className="bg-gradient-primary text-white text-sm font-bold">
                  {user.displayName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{user.displayName}</p>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              </div>

              <Button
                size="sm"
                variant={getFriendshipStatus(user._id) === "none" ? "default" : "outline"}
                disabled={sendingId === user._id || getFriendshipStatus(user._id) !== "none"}
                onClick={() => handleAddFriend(user)}
                className={`shrink-0 h-8 px-3 text-xs font-semibold transition-all ${
                  getFriendshipStatus(user._id) === "none"
                    ? "bg-gradient-primary text-white hover:opacity-90"
                    : "glass opacity-70"
                }`}
              >
                {sendingId === user._id ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : getFriendshipStatus(user._id) === "sent" ? (
                  "Đã gửi"
                ) : getFriendshipStatus(user._id) === "friend" ? (
                  "Bạn bè"
                ) : (
                  <>
                    <UserPlus className="size-3 mr-1" />
                    Kết bạn
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendModal;
