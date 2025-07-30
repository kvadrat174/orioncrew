import React, { useEffect, useState } from "react";
import { Users, ChevronUp, ChevronDown, Plus, Loader2, X } from "lucide-react";
import CrewMember from "./CrewMember";
import type { TeamMember } from "../types/telegram";
import { BASE_URL } from "./TelegramCrewApp";
import axios from "axios";

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
  onAddMember: (memberId: string) => void;
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
  onAddMember,
  onConfirmRemoval,
  onCancelRemoval,
}) => {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState("");
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<TeamMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const fetchAvailableMembers = async () => {
    setIsLoadingMembers(true);
    setMembersError(null);
    try {
      const response = await axios.get<
        Array<{ id: string; name: string; position: string }>
      >(`${BASE_URL}/free-crew/${tripId}`);
      setAvailableMembers(response.data);
    } catch (error) {
      console.error("Ошибка при загрузке участников:", error);
      setMembersError("Не удалось загрузить список участников");
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (isExpanded && isCaptain) {
      fetchAvailableMembers();
    }
  }, [isExpanded, isCaptain]);

  const handleAddMember = async () => {
    if (!selectedMember) return;

    setIsAddLoading(true);
    try {
      await onAddMember(selectedMember);
      setSelectedMember("");
      setIsAddingMember(false);
      // Обновляем список после добавления
      await fetchAvailableMembers();
    } catch (error) {
      console.error("Ошибка при добавлении участника:", error);
    } finally {
      setIsAddLoading(false);
    }
  };

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
          {/* Кнопка добавления для капитана */}
          {isCaptain && (
            <div className="mb-2">
              {!isAddingMember ? (
                <button
                  onClick={() => setIsAddingMember(true)}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                  disabled={isLoadingMembers}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {isLoadingMembers ? "Загрузка..." : "Добавить участника"}
                </button>
              ) : (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedMember}
                      onChange={(e) => setSelectedMember(e.target.value)}
                      className="flex-1 p-2 border rounded-md text-sm"
                      disabled={
                        isLoadingMembers || availableMembers.length === 0
                      }
                    >
                      <option value="">Выберите участника</option>
                      {availableMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.position})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddMember}
                      disabled={!selectedMember || isAddLoading}
                      className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:bg-gray-300 flex items-center"
                    >
                      {isAddLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : null}
                      Добавить
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingMember(false);
                        setSelectedMember("");
                      }}
                      className="px-3 py-1 bg-gray-200 rounded-md text-sm hover:bg-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Отображение состояния загрузки */}
                  {isLoadingMembers && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Загрузка списка участников...
                    </div>
                  )}

                  {/* Отображение ошибки */}
                  {membersError && (
                    <div className="text-red-500 text-sm">
                      {membersError}
                      <button
                        onClick={fetchAvailableMembers}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        Попробовать снова
                      </button>
                    </div>
                  )}

                  {/* Сообщение, если нет доступных участников */}
                  {!isLoadingMembers &&
                    availableMembers.length === 0 &&
                    !membersError && (
                      <div className="text-sm text-gray-500">
                        Нет доступных участников для добавления
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* Список участников */}
          {crew.map((member) => (
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
          ))}

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
