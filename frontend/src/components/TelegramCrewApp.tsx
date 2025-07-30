import React, { useState, useEffect } from "react";
import { Sailboat } from "lucide-react";
import WebApp from "@twa-dev/sdk";
import type { TgUser } from "../types/telegram";
import axios from "axios";
import { getDaysInMonth } from "../utils/utils";
import { CAPTAIN_ID } from "../utils/constants";
import type { SeaTrip } from "../interfaces/inrefaces";
import UserBadge from "./UserBadge";
import CalendarHeader from "./CalendarHeader";
import CalendarGrid from "./CalendarGrid";
import LoadingSpinner from "./LoadingSpinner";
import TripCard from "./TripCard";
import EmptyState from "./EmptyState";

export const BASE_URL = "https://crew.mysailing.ru/api";

declare global {
  interface Window {
    Telegram?: {
      WebApp: typeof WebApp;
    };
  }
}

const TelegramCrewApp: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [seaTrips, setSeaTrips] = useState<SeaTrip[]>([]);
  const [tgUser, setTgUser] = useState<TgUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<{
    tripId: string | null;
    memberId: string | null;
  }>({ tripId: null, memberId: null });
  const [expandedCrew, setExpandedCrew] = useState<Set<string>>(new Set());
  const [softRemovedMembers, setSoftRemovedMembers] = useState<
    Record<string, string[]>
  >({});

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTripType, setNewTripType] = useState<SeaTrip["type"]>("training");
  const [newTripDateTime, setNewTripDateTime] = useState("");

  useEffect(() => {
    WebApp.ready();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const telegramApp = window.Telegram.WebApp;
      setTgUser(telegramApp.initDataUnsafe.user ?? null);
      telegramApp.ready();
      telegramApp.expand();
      document.body.style.backgroundColor = "#1f2937";

      telegramApp.MainButton.setText("Обновить данные");
      telegramApp.MainButton.onClick(() => {
        fetchTrips();
        telegramApp.showAlert("Данные обновлены!");
      });

      if (seaTrips.length > 0) {
        telegramApp.MainButton.show();
      }
    }
  }, [seaTrips]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const [tripsResponse] = await Promise.all([
        axios.get<SeaTrip[]>(`${BASE_URL}/trips`),
      ]);
      setSeaTrips(tripsResponse.data);
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("Ошибка загрузки данных");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handlePrevMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    setCurrentMonth(new Date(year, month - 1));
  };

  const handleNextMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    setCurrentMonth(new Date(year, month + 1));
  };

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

  const handleCrewAction = async (
    tripId: string,
    action: "add" | "remove",
    memberId?: string,
    byCaptain = false
  ) => {
    if (!tgUser) {
      window.Telegram?.WebApp?.showAlert("Пользователь не авторизован");
      return;
    }

    if (byCaptain && action === "remove") {
      const isSoftRemoved = softRemovedMembers[tripId]?.includes(memberId!);
      if (isSoftRemoved) {
        setSoftRemovedMembers((prev) => ({
          ...prev,
          [tripId]: prev[tripId].filter((id) => id !== memberId),
        }));
        return;
      } else {
        setSoftRemovedMembers((prev) => ({
          ...prev,
          [tripId]: [...(prev[tripId] || []), memberId!],
        }));
        return;
      }
    }

    setActionLoading({ tripId, memberId: memberId || null });

    try {
      const endpoint = action === "add" ? "join" : "leave";
      const payload = {
        tripId: tripId,
        userId: String(memberId || tgUser.id),
        byCaptain,
      };

      const response = await axios.post(
        `${BASE_URL}/trips/${endpoint}`,
        payload
      );

      setSeaTrips(response.data);

      window.Telegram?.WebApp?.showAlert(
        `Успешно! Пользователь ${action === "add" ? "записан" : "выписан"}.`
      );
    } catch (error) {
      console.error("Ошибка при изменении состава экипажа:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || "Произошла ошибка"
        : "Произошла ошибка";
      window.Telegram?.WebApp?.showAlert(errorMessage);
    } finally {
      setActionLoading({ tripId: null, memberId: null });
    }
  };

  const confirmRemoval = async (tripId: string) => {
    if (!softRemovedMembers[tripId]?.length) return;

    try {
      setActionLoading({ tripId, memberId: null });

      await Promise.all(
        softRemovedMembers[tripId].map((memberId) =>
          axios.post(`${BASE_URL}/trips/leave`, {
            tripId,
            userId: memberId,
            byCaptain: true,
          })
        )
      );

      const response = await axios.get<SeaTrip[]>(`${BASE_URL}/trips`);
      setSeaTrips(response.data);
      setSoftRemovedMembers((prev) => ({ ...prev, [tripId]: [] }));

      window.Telegram?.WebApp?.showAlert("Удаление подтверждено!");
    } catch (error) {
      console.error("Ошибка при подтверждении удаления:", error);
      window.Telegram?.WebApp?.showAlert("Ошибка при удалении участников");
    } finally {
      setActionLoading({ tripId: null, memberId: null });
    }
  };

  const handleAddMember = async (tripId: string, memberId: string) => {
    try {
      setActionLoading({ tripId, memberId });

      const response = await axios.post(`${BASE_URL}/trips/join`, {
        tripId,
        userId: memberId,
        byCaptain: true,
      });

      setSeaTrips(response.data);

      setSoftRemovedMembers((prev) => ({
        ...prev,
        [tripId]: prev[tripId]?.filter((id) => id !== memberId) || [],
      }));

      window.Telegram?.WebApp?.showAlert("Участник успешно добавлен!");
    } catch (error) {
      console.error("Ошибка при добавлении участника:", error);
      const msg = axios.isAxiosError(error)
        ? error.response?.data?.message || "Не удалось добавить участника"
        : "Не удалось добавить участника";
      window.Telegram?.WebApp?.showAlert(msg);
    } finally {
      setActionLoading({ tripId: null, memberId: null });
    }
  };

  const getTripsForDate = (dateString: string) => {
    return seaTrips.filter((trip) => trip.date === dateString);
  };

  const isCaptain = tgUser?.id === CAPTAIN_ID;

  const isUserInTrip = (trip: SeaTrip) => {
    if (!tgUser) return false;
    return trip.crew.some((member) => member.id === String(tgUser.id));
  };

  const days = getDaysInMonth(currentMonth);
  const selectedTrips = selectedDate ? getTripsForDate(selectedDate) : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sailboat className="w-6 h-6" />
              <h1 className="text-xl font-bold">Календарь экипажа</h1>
            </div>
            {tgUser && <UserBadge tgUser={tgUser} isCaptain={isCaptain} />}
          </div>
          {isCaptain && (
            <div className="mt-2">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded"
              >
                + Создать выход
              </button>
            </div>
          )}
        </div>

        <CalendarHeader
          currentMonth={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />

        <CalendarGrid
          currentMonth={currentMonth}
          days={days}
          seaTrips={seaTrips}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        {loading ? (
          <LoadingSpinner />
        ) : selectedTrips?.length ? (
          selectedTrips
            .sort((a, b) => a.departure.localeCompare(b.departure))
            .map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                isCaptain={isCaptain}
                isUserInTrip={isUserInTrip(trip)}
                isCrewExpanded={expandedCrew.has(trip.id)}
                actionLoading={actionLoading}
                softRemovedMembers={softRemovedMembers[trip.id] || []}
                onToggleCrewExpanded={() => toggleCrewExpanded(trip.id)}
                onJoinLeave={(action) =>
                  handleCrewAction(trip.id, action, String(tgUser!.id))
                }
                onRemoveMember={(memberId) =>
                  handleCrewAction(trip.id, "remove", memberId, true)
                }
                onConfirmRemoval={() => confirmRemoval(trip.id)}
                onCancelRemoval={() =>
                  setSoftRemovedMembers((prev) => ({
                    ...prev,
                    [trip.id]: [],
                  }))
                }
                onAddMember={(memberId) => handleAddMember(trip.id, memberId)}
              />
            ))
        ) : !selectedDate ? (
          <EmptyState type="no-date-selected" />
        ) : (
          <EmptyState type="no-trips" />
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-lg relative">
            <h2 className="text-lg font-bold mb-4">Создать выход</h2>

            <label className="block mb-2 text-sm font-medium">Тип</label>
            <select
              value={newTripType}
              onChange={(e) =>
                setNewTripType(e.target.value as SeaTrip["type"])
              }
              className="w-full mb-4 border px-3 py-2 rounded"
            >
              {[
                "morningTraining",
                "training",
                "trainingRace",
                "race",
                "trip",
                "commercial",
                "ladoga",
              ].map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <label className="block mb-2 text-sm font-medium">
              Дата и время
            </label>
            <input
              type="datetime-local"
              value={newTripDateTime}
              onChange={(e) => setNewTripDateTime(e.target.value)}
              className="w-full mb-4 border px-3 py-2 rounded"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-600 hover:text-black"
              >
                Отмена
              </button>
              <button
                onClick={async () => {
                  if (!newTripDateTime) {
                    window.Telegram?.WebApp?.showAlert("Укажите дату и время");
                    return;
                  }
                  try {
                    const response = await axios.post(`${BASE_URL}/trip`, {
                      type: newTripType,
                      departure: newTripDateTime,
                    });
                    setSeaTrips(response.data);
                    setIsCreateModalOpen(false);
                    window.Telegram?.WebApp?.showAlert("Выход создан!");
                  } catch (error) {
                    console.error("Ошибка при создании выхода:", error);
                    const msg = axios.isAxiosError(error)
                      ? error.response?.data?.message || "Ошибка создания"
                      : "Ошибка создания";
                    window.Telegram?.WebApp?.showAlert(msg);
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramCrewApp;
