import { Heart, Loader2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/user";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";
import { useUserStore } from "@/stores/useUserStore";

type ProfileFormData = {
  displayName: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
};

type Props = {
  userInfo: User | null;
};

const PersonalInfoForm = ({ userInfo }: Props) => {
  const [loading, setLoading] = useState(false);
  const { updateProfile } = useUserStore();
  
  const { register, handleSubmit } = useForm<ProfileFormData>({
    defaultValues: {
      displayName: userInfo?.displayName ?? "",
      username: userInfo?.username ?? "",
      email: userInfo?.email ?? "",
      phone: userInfo?.phone ?? "",
      bio: userInfo?.bio ?? "",
    },
  });

  if (!userInfo) return null;

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    try {
      await updateProfile({
        displayName: data.displayName,
        bio: data.bio,
        phone: data.phone,
      });
      
      toast.success("Cập nhật thông tin thành công! ✨");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Cập nhật thất bại. Hãy thử lại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-strong border-border/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="size-5 text-primary" />
          Thông tin cá nhân
        </CardTitle>
        <CardDescription>
          Cập nhật chi tiết cá nhân và thông tin hồ sơ của bạn
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Tên hiển thị</Label>
              <Input
                id="displayName"
                {...register("displayName")}
                className="glass-light border-border/30"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Tên người dùng (@)</Label>
              <Input
                id="username"
                disabled
                value={userInfo.username}
                className="glass-light border-border/30 opacity-50 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                disabled
                value={userInfo.email}
                className="glass-light border-border/30 opacity-50 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                {...register("phone")}
                className="glass-light border-border/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Giới thiệu</Label>
            <Textarea
              id="bio"
              rows={3}
              {...register("bio")}
              className="glass-light border-border/30 resize-none"
            />
          </div>

          <Button 
            disabled={loading}
            type="submit"
            className="w-full md:w-auto bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Lưu thay đổi
          </Button>
        </CardContent>
      </form>
    </Card>
  );
};

export default PersonalInfoForm;
