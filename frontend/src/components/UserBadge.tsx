import React from "react";
import type { TgUser } from "../types/telegram";
import { User } from "lucide-react";

interface UserBadgeProps {
  tgUser: TgUser;
  isCaptain: boolean;
}

const UserBadge: React.FC<UserBadgeProps> = ({ tgUser, isCaptain }) => {
  return (
    <div className="flex items-center space-x-2 text-sm">
      <User className="w-4 h-4" />
      <span>{tgUser.first_name}</span>
      {isCaptain && (
        <span className="text-xs bg-yellow-500 px-1 rounded">Капитан</span>
      )}
    </div>
  );
};

export default UserBadge;
