import React from "react";

interface DayCellProps {
  day: number | null;
  dateString: string;
  tripsCount: number;
  isSelected: boolean;
  isToday: boolean;
  onSelect: (dateString: string) => void;
}

const DayCell: React.FC<DayCellProps> = ({
  day,
  dateString,
  tripsCount,
  isSelected,
  isToday,
  onSelect,
}) => {
  if (day === null) {
    return <div className="p-2"></div>;
  }

  return (
    <button
      onClick={() => onSelect(dateString)}
      className={`relative p-2 text-center rounded-lg transition-colors ${
        isSelected
          ? "bg-blue-600 text-white"
          : isToday
          ? "bg-gray-100 text-gray-800 font-bold border border-gray-300"
          : "hover:bg-gray-100"
      }
${tripsCount > 0 ? "font-bold" : ""}`}
    >
      {day}
      {tripsCount > 0 && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
      )}
      {isToday && !isSelected && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-gray-400 rounded-full"></div>
      )}
    </button>
  );
};

export default DayCell;
