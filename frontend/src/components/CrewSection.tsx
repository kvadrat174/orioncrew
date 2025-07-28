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
  softRemovedMembers?: string[];
  onToggleExpanded: () => void;
  onRemoveMember: (memberId: string) => void;
  onConfirmRemoval?: () => void;
  onCancelRemoval?: () => void;
}

const CrewSection: React.FC<CrewSectionProps> = ({
  tripId,
  crew,
  isExpanded,
  isCaptain,
  actionLoading,
  softRemovedMembers = [],
  onToggleExpanded,
  onRemoveMember,
  onConfirmRemoval,
  onCancelRemoval,
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
          {softRemovedMembers.length > 0 && (
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {softRemovedMembers.length} вычеркнуто
            </span>
          )}
        </h4>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </div>

      {isExpanded && (
        <div className="space-y-3 transition-all duration-300 ease-in-out">
          {crew.map((member) => {
            return (
              <CrewMember
                key={member.id}
                member={member}
                isCaptain={isCaptain}
                isRemoving={
                  actionLoading.tripId === tripId &&
                  actionLoading.memberId === member.id
                }
                isRemoved={softRemovedMembers.includes(member.id)}
                onRemove={() => onRemoveMember(member.id)}
              />
            );
          })}

          {/* Блок подтверждения удаления */}
          {isCaptain && softRemovedMembers.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end space-x-2">
              <button
                onClick={onCancelRemoval}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Отменить
              </button>
              <button
                onClick={onConfirmRemoval}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Подтвердить удаление ({softRemovedMembers.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CrewSection;
