import { Users, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
  
const Crew: React.FC = (trip) => {
  const [expandedCrew, setExpandedCrew] = useState<Set<string>>(new Set());

  const toggleCrewExpanded = (tripId: string) => {
    setExpandedCrew((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tripId)) {
        newSet.delete(tripId);
      } else {
        newSet.add(tripId);
      }
      return newSet;
    });
  };

  return (
    <>
      {/* Состав экипажа */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div
          className="flex items-center justify-between cursor-pointer mb-3"
          onClick={() => toggleCrewExpanded(trip.id)}
        >
          <h4 className="text-md font-semibold flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Состав экипажа ({trip.crew.length} чел.)
          </h4>
          {expandedCrew.has(trip.id) ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>

        {expandedCrew.has(trip.id) && (
          <div className="space-y-3 transition-all duration-300 ease-in-out">
            {trip.crew.map((member) => (
              <div
                key={member.id}
                className="border-l-4 border-blue-600 pl-3 py-2 flex justify-between items-start"
              >
                <div>
                  <div className="font-medium text-gray-900">{member.name}</div>
                  <div className="text-sm text-blue-600 font-medium">
                    {member.position}
                  </div>
                </div>

                {isCaptain && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() =>
                        handleCrewAction(trip.id, "remove", member.id, true)
                      }
                      disabled={
                        actionLoading.tripId === trip.id &&
                        actionLoading.memberId === member.id
                      }
                      className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                      title="Удалить из экипажа"
                    >
                      {actionLoading.tripId === trip.id &&
                      actionLoading.memberId === member.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      ;
    </>
  );
};

export default Crew;
