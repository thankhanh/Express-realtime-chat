import { useState, useEffect } from "react";
import { Shield, ShieldBan, Eye, EyeOff, Search, X, Loader2, AlertTriangle } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { userService } from "@/services/userService";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";
import { useFriendStore } from "@/stores/useFriendStore";

// ── Đổi Mật Khẩu ─────────────────────────────────────
const ChangePasswordSection = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    setLoading(true);
    try {
      await userService.changePassword({ oldPassword, newPassword });
      toast.success("Đổi mật khẩu thành công! 🔐");
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
      setOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full justify-start glass-light border-border/30 hover:text-warning"
        onClick={() => setOpen(!open)}
      >
        <Shield className="h-4 w-4 mr-2" />
        Đổi mật khẩu
      </Button>

      {open && (
        <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/30">
          <div className="space-y-1.5">
            <Label className="text-sm">Mật khẩu hiện tại</Label>
            <div className="relative">
              <Input
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
                className="glass-light border-border/30 pr-10"
                required
              />
              <button type="button" onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showOld ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Mật khẩu mới</Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                className="glass-light border-border/30 pr-10"
                required
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Xác nhận mật khẩu mới</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className={`glass-light border-border/30 ${confirmPassword && newPassword !== confirmPassword ? 'border-destructive' : ''}`}
              required
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">Mật khẩu không khớp</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading} className="bg-gradient-primary hover:opacity-90">
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Xác nhận
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Hủy</Button>
          </div>
        </form>
      )}
    </div>
  );
};

// ── Chặn Người Dùng ───────────────────────────────────
const BlockUserSection = () => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingBlock, setLoadingBlock] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const { searchByUsername } = useFriendStore();

  useEffect(() => {
    if (open) {
      userService.getBlockedUsers().then((data) => setBlockedUsers(data.blockedUsers || []));
    }
  }, [open]);

  // Tự động tìm kiếm khi gõ (Debounce 500ms)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const users = await searchByUsername(searchQuery);
      // Lọc bỏ chính mình khỏi kết quả tìm kiếm nếu cần (thường backend đã xử lý hoặc store đã xử lý)
      setSearchResults(users);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleBlock = async (userId: string, displayName: string) => {
    setLoadingBlock(userId);
    try {
      await userService.blockUser(userId);
      toast.success(`Đã chặn ${displayName}`);
      const data = await userService.getBlockedUsers();
      setBlockedUsers(data.blockedUsers || []);
      setSearchResults([]);
      setSearchQuery("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Chặn thất bại");
    } finally {
      setLoadingBlock(null);
    }
  };

  const handleUnblock = async (userId: string, displayName: string) => {
    setLoadingBlock(userId);
    try {
      await userService.unblockUser(userId);
      toast.success(`Đã bỏ chặn ${displayName}`);
      setBlockedUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch {
      toast.error("Bỏ chặn thất bại");
    } finally {
      setLoadingBlock(null);
    }
  };

  const isBlocked = (userId: string) => blockedUsers.some((u) => u._id === userId);

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full justify-start glass-light border-border/30 hover:text-destructive"
        onClick={() => setOpen(!open)}
      >
        <ShieldBan className="size-4 mr-2" />
        Chặn người dùng
      </Button>

      {open && (
        <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/30">
          {/* Search */}
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm username để chặn..."
              className="glass-light border-border/30 pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {searchLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Kết quả tìm kiếm:</p>
              {searchResults.map((user) => (
                <div key={user._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30">
                  <Avatar className="size-8">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback className="bg-gradient-primary text-white text-xs font-bold">
                      {user.displayName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                  <Button
                    size="sm" variant={isBlocked(user._id) ? "ghost" : "destructive"}
                    className="shrink-0 text-xs h-7"
                    disabled={loadingBlock === user._id}
                    onClick={() => isBlocked(user._id)
                      ? handleUnblock(user._id, user.displayName)
                      : handleBlock(user._id, user.displayName)}
                  >
                    {loadingBlock === user._id
                      ? <Loader2 className="size-3 animate-spin" />
                      : isBlocked(user._id) ? "Bỏ chặn" : "Chặn"}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Blocked Users List */}
          {blockedUsers.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Đang chặn ({blockedUsers.length}):</p>
              {blockedUsers.map((user) => (
                <div key={user._id} className="flex items-center gap-3 p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                  <Avatar className="size-8">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback className="bg-muted text-xs font-bold">
                      {user.displayName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                  <Button
                    size="sm" variant="ghost" className="shrink-0 text-xs h-7 hover:bg-green-500/10 hover:text-green-600"
                    disabled={loadingBlock === user._id}
                    onClick={() => handleUnblock(user._id, user.displayName)}
                  >
                    {loadingBlock === user._id ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3 mr-1" />}
                    Bỏ chặn
                  </Button>
                </div>
              ))}
            </div>
          )}

          {blockedUsers.length === 0 && searchResults.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Bạn chưa chặn ai. Tìm username ở trên để chặn.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ── Xóa Tài Khoản ─────────────────────────────────────
const DeleteAccountSection = () => {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signOut } = useAuthStore();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { toast.error("Nhập mật khẩu để xác nhận"); return; }
    setLoading(true);
    try {
      await userService.deleteAccount(password);
      toast.success("Tài khoản đã được xóa");
      await signOut();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Xóa tài khoản thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-4 border-t border-border/30 space-y-3">
      <h4 className="font-semibold text-sm text-destructive flex items-center gap-2">
        <AlertTriangle className="size-4" />
        Khu vực nguy hiểm
      </h4>

      {!open ? (
        <Button variant="destructive" className="w-full" onClick={() => setOpen(true)}>
          Xoá tài khoản
        </Button>
      ) : (
        <form onSubmit={handleDelete}
          className="space-y-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
          <p className="text-sm text-destructive font-medium">
            ⚠️ Hành động này không thể hoàn tác! Toàn bộ dữ liệu của bạn sẽ bị xóa vĩnh viễn.
          </p>
          <div className="space-y-1.5">
            <Label className="text-sm">Nhập mật khẩu để xác nhận xóa tài khoản</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu của bạn"
                className="border-destructive/50 bg-background pr-10"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="destructive" size="sm" disabled={loading} className="flex-1">
              {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Xác nhận xóa tài khoản
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setOpen(false); setPassword(""); }}>
              Hủy
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

// ── Main ─────────────────────────────────────────────
const PrivacySettings = () => (
  <Card className="glass-strong border-border/30">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        Quyền riêng tư &amp; Bảo mật
      </CardTitle>
      <CardDescription>
        Quản lý cài đặt quyền riêng tư và bảo mật của bạn
      </CardDescription>
    </CardHeader>

    <CardContent className="space-y-4">
      <ChangePasswordSection />
      <BlockUserSection />
      <DeleteAccountSection />
    </CardContent>
  </Card>
);

export default PrivacySettings;
