import { Sun, Moon } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useThemeStore } from "@/stores/useThemeStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useState, useEffect } from "react";

const PreferencesForm = () => {
  const { isDark, toggleTheme } = useThemeStore();
  const { socket, onlineUsers } = useSocketStore();
  const { user } = useAuthStore();

  // Đồng bộ toggle với trạng thái online thực tế của user
  const [onlineVisible, setOnlineVisible] = useState(() =>
    user ? onlineUsers.includes(user._id) : false
  );

  // Cập nhật lại khi onlineUsers thay đổi (socket connect xong)
  useEffect(() => {
    if (user) {
      setOnlineVisible(onlineUsers.includes(user._id));
    }
  }, [onlineUsers, user]);

  const handleOnlineVisibilityChange = (checked: boolean) => {
    setOnlineVisible(checked);
    if (socket) {
      // Emit tới server để broadcast cho tất cả client ngay lập tức
      socket.emit("set-online-visibility", { visible: checked });
    }
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5 text-primary" />
          Tuỳ chỉnh ứng dụng
        </CardTitle>
        <CardDescription>Cá nhân hoá trải nghiệm trò chuyện của bạn</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Dark Mode */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="theme-toggle" className="text-base font-medium">
              Chế độ tối
            </Label>
            <p className="text-sm text-muted-foreground">
              Chuyển đổi giữa giao diện sáng và tối
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-muted-foreground" />
            <Switch
              id="theme-toggle"
              checked={isDark}
              onCheckedChange={toggleTheme}
              className="data-[state=checked]:bg-primary-glow"
            />
            <Moon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Online Status Visibility */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="online-status" className="text-base font-medium">
              Hiển thị trạng thái online
            </Label>
            <p className="text-sm text-muted-foreground">
              {onlineVisible
                ? "Mọi người thấy bạn đang online"
                : "Bạn đang ẩn trạng thái — người khác thấy bạn offline"}
            </p>
          </div>
          <Switch
            id="online-status"
            checked={onlineVisible}
            onCheckedChange={handleOnlineVisibilityChange}
            className="data-[state=checked]:bg-primary-glow"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PreferencesForm;
