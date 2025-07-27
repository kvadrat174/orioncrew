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
          ? "bg-gray-200 text-gray-800 font-bold"
          : "hover:bg-gray-100"
      }
${tripsCount > 0 ? "font-bold" : ""}`}
    >
      {day}
      {tripsCount > 0 && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex justify-center space-x-1">
          {[...Array(tripsCount)].map((_, index) => (
            <div key={index} className="w-1 h-1 bg-blue-600 rounded-full"></div>
          ))}
        </div>
      )}
    </button>
  );
};

export default DayCell;
