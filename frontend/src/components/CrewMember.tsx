import React from "react";
import { Loader2, X } from "lucide-react";

interface CrewMemberProps {
  member: {
    id: string;
    name: string;
    position: string;
  };
  isCaptain: boolean;
  isRemoving: boolean;
  onRemove: () => void;
}

const CrewMember: React.FC<CrewMemberProps> = ({
  member,
  isCaptain,
  isRemoving,
  onRemove,
}) => {
  return (
    <div className="border-l-4 border-blue-600 pl-3 py-2 flex justify-between items-start">
      <div>
        <div className="font-medium text-gray-900">{member.name}</div>
        <div className="text-sm text-blue-600 font-medium">
          {member.position}
        </div>
      </div>

      {isCaptain && (
        <div className="flex space-x-1">
          <button
            onClick={onRemove}
            disabled={isRemoving}
            className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
            title="Удалить из экипажа"
          >
            {isRemoving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CrewMember;
