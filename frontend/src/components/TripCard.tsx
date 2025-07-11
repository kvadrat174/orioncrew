import React from "react";
import type { SeaTrip } from "../interfaces/inrefaces";
import { Clock, Loader2, Ship } from "lucide-react";
import { getStatusColor, getTypeText } from "../utils/utils";
import CrewSection from "./CrewSection";

interface TripCardProps {
  trip: SeaTrip;
  isCaptain: boolean;
  isUserInTrip: boolean;
  isCrewExpanded: boolean;
  actionLoading: {
    tripId: string | null;
    memberId: string | null;
  };
  onToggleCrewExpanded: () => void;
  onJoinLeave: (action: "add" | "remove") => void;
  onRemoveMember: (memberId: string) => void;
}

const TripCard: React.FC<TripCardProps> = ({
  trip,
  isCaptain,
  isUserInTrip,
  isCrewExpanded,
  actionLoading,
  onToggleCrewExpanded,
  onJoinLeave,
  onRemoveMember,
}) => {
  const isMainActionLoading =
    actionLoading.tripId === trip.id && actionLoading.memberId === null;

  return (
    <div className="border-t bg-gray-50 p-4">
      <div className="space-y-4">
        {/* Информация о рейсе */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Ship className="w-5 h-5 mr-2 text-blue-600" />
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  trip.status
                )}`}
              >
                {getTypeText(trip.type)}
              </span>
            </div>
            <div className="flex items-center">
              {/* Кнопки записи/выписки для обычных пользователей */}
              {!isCaptain && (
                <button
                  onClick={() => onJoinLeave(isUserInTrip ? "remove" : "add")}
                  disabled={isMainActionLoading}
                  className={`ml-2 px-3 py-1 rounded-md text-sm font-medium ${
                    isUserInTrip
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "bg-green-100 text-green-600 hover:bg-green-200"
                  }`}
                >
                  {isMainActionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin inline" />
                  ) : isUserInTrip ? (
                    "Отменить запись"
                  ) : (
                    "Записаться"
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span>Выход: {trip.departure}</span>
            </div>
          </div>
        </div>

        {/* Состав экипажа */}
        <CrewSection
          tripId={trip.id}
          crew={trip.crew}
          isExpanded={isCrewExpanded}
          isCaptain={isCaptain}
          actionLoading={actionLoading}
          onToggleExpanded={onToggleCrewExpanded}
          onRemoveMember={onRemoveMember}
        />
      </div>
    </div>
  );
};

export default TripCard;
