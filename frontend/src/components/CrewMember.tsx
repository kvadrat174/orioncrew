import React from "react";
import { Loader2, Undo, X } from "lucide-react";

interface CrewMemberProps {
  member: {
    id: string;
    name: string;
    position: string;
  };
  isCaptain: boolean;
  isRemoving: boolean;
  isRemoved?: boolean;
  onRemove: () => void;
}

const CrewMember: React.FC<CrewMemberProps> = ({
  member,
  isCaptain,
  isRemoving,
  isRemoved = false,
  onRemove,
}) => {
  return (
    <div
      className={`flex items-center p-2 rounded-lg ${
        isRemoved ? "bg-gray-50 opacity-70" : "hover:bg-gray-50"
      }`}
    >
      <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
        <span className="text-xs text-gray-500">
          {member.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1">
        <p
          className={`text-sm ${isRemoved ? "text-gray-400" : "text-gray-800"}`}
        >
          {member.name}
        </p>
        <p className="text-xs text-gray-500">{member.position}</p>
      </div>
      {isCaptain && (
        <button
          onClick={onRemove}
          disabled={isRemoving}
          className={`p-1 rounded-full ${
            isRemoved
              ? "text-blue-500 hover:bg-blue-50"
              : "text-red-500 hover:bg-red-50"
          }`}
        >
          {isRemoving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isRemoved ? (
            <Undo className="w-4 h-4" />
          ) : (
            <X className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
};

export default CrewMember;
