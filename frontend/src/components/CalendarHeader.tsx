import React from "react";
import { monthNames } from "../utils/constants";

interface CalendarHeaderProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentMonth,
  onPrevMonth,
  onNextMonth,
}) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <button
        onClick={onPrevMonth}
        className="p-2 rounded-lg hover:bg-gray-100"
      >
        ←
      </button>
      <h2 className="text-lg font-semibold">
        {monthNames[month]} {year}
      </h2>
      <button
        onClick={onNextMonth}
        className="p-2 rounded-lg hover:bg-gray-100"
      >
        →
      </button>
    </div>
  );
};

export default CalendarHeader;
