import React from "react";
import { Users, ChevronUp, ChevronDown } from "lucide-react";
import CrewMember from "./CrewMember";

interface CrewSectionProps {
  tripId: string;
  crew: Array<{
    id: string;
    name: string;
    position: string;
  }>;
  isExpanded: boolean;
  isCaptain: boolean;
  actionLoading: {
    tripId: string | null;
    memberId: string | null;
  };
  onToggleExpanded: () => void;
  onRemoveMember: (memberId: string) => void;
}

const CrewSection: React.FC<CrewSectionProps> = ({
  tripId,
  crew,
  isExpanded,
  isCaptain,
  actionLoading,
  onToggleExpanded,
  onRemoveMember,
}) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div
        className="flex items-center justify-between cursor-pointer mb-3"
        onClick={onToggleExpanded}
      >
        <h4 className="text-md font-semibold flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-600" />
          Состав экипажа ({crew.length} чел.)
        </h4>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </div>

      {isExpanded && (
        <div className="space-y-3 transition-all duration-300 ease-in-out">
          {crew.map((member) => (
            <CrewMember
              key={member.id}
              member={member}
              isCaptain={isCaptain}
              isRemoving={
                actionLoading.tripId === tripId &&
                actionLoading.memberId === member.id
              }
              onRemove={() => onRemoveMember(member.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CrewSection;
