import { Calendar, Ship } from "lucide-react";
import React from "react";

interface EmptyStateProps {
  type: "no-date-selected" | "no-trips";
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, className = "" }) => {
  const config = {
    "no-date-selected": {
      icon: Calendar,
      message: "Выберите дату для просмотра состава экипажа",
    },
    "no-trips": {
      icon: Ship,
      message: "На выбранную дату рейсов не запланировано",
    },
  };

  const { icon: Icon, message } = config[type];

  return (
    <div
      className={`border-t bg-gray-50 p-8 text-center text-gray-500 ${className}`}
    >
      <Icon className="w-12 h-12 mx-auto mb-2 opacity-50" />
      <p>{message}</p>
    </div>
  );
};

export default EmptyState;
