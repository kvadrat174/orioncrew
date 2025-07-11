import React from "react";
import type { SeaTrip } from "../interfaces/inrefaces";
import { formatDate, getCurrentDate } from "../utils/utils";
import { weekDays } from "../utils/constants";
import DayCell from "./DayCell";

interface CalendarGridProps {
  currentMonth: Date;
  days: (number | null)[];
  seaTrips: SeaTrip[];
  selectedDate: string | null;
  onDateSelect: (dateString: string) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentMonth,
  days,
  seaTrips,
  selectedDate,
  onDateSelect,
}) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const getTripsForDate = (dateString: string) => {
    return seaTrips.filter((trip) => trip.date === dateString);
  };

  return (
    <div className="p-4">
      {/* Дни недели */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 p-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Дни месяца */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="p-2"></div>;
          }

          const dateString = formatDate(year, month, day);
          const trips = getTripsForDate(dateString);
          const isSelected = selectedDate === dateString;
          const isToday = dateString === getCurrentDate();

          return (
            <DayCell
              key={day}
              day={day}
              dateString={dateString}
              tripsCount={trips.length}
              isSelected={isSelected}
              isToday={isToday}
              onSelect={onDateSelect}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
