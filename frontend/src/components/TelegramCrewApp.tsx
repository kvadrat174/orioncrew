import React, { useState, useEffect } from "react";
import "react-calendar/dist/Calendar.css";
import "react-datetime-picker/dist/DateTimePicker.css";
import { Sailboat, Calendar, Clock } from "lucide-react";
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
  
  // Заменяем единый DateTime picker на отдельные поля
  const [newTripDate, setNewTripDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD format
  });
  const [newTripTime, setNewTripTime] = useState<string>("10:00");

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

  // Функция для создания локального ISO времени
  const createLocalDateTime = (date: string, time: string): string => {
    // Создаем дату в локальном времени
    const localDateTime = new Date(`${date}T${time}:00`);
    
    // Получаем смещение временной зоны в минутах и конвертируем в миллисекунды
    const timezoneOffset = localDateTime.getTimezoneOffset() * 60000;
    
    // Создаем локальное время, компенсируя смещение временной зоны
    const localTime = new Date(localDateTime.getTime() - timezoneOffset);
    
    return localTime.toISOString();
  };

  const handleCreateTrip = async () => {
    if (!newTripDate || !newTripTime) {
      window.Telegram?.WebApp?.showAlert("Укажите дату и время");
      return;
    }

    try {
      const localDateTime = createLocalDateTime(newTripDate, newTripTime);
      
      const response = await axios.post(`${BASE_URL}/trip`, {
        type: newTripType,
        departure: localDateTime,
      });
      
      setSeaTrips(response.data);
      setIsCreateModalOpen(false);
      
      // Сбрасываем форму
      const today = new Date();
      setNewTripDate(today.toISOString().split('T')[0]);
      setNewTripTime("10:00");
      setNewTripType("training");
      
      window.Telegram?.WebApp?.showAlert("Выход создан!");
    } catch (error) {
      console.error("Ошибка при создании выхода:", error);
      const msg = axios.isAxiosError(error)
        ? error.response?.data?.message || "Ошибка создания"
        : "Ошибка создания";
      window.Telegram?.WebApp?.showAlert(msg);
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

  // Предустановленные варианты времени
  const timeOptions = [
    "08:00", "09:00", "10:00", "11:00", "12:00", 
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
            <h2 className="text-lg font-bold mb-6 text-center">Создать выход</h2>

            {/* Тип выхода */}
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Тип выхода
              </label>
              <select
                value={newTripType}
                onChange={(e) =>
                  setNewTripType(e.target.value as SeaTrip["type"])
                }
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[
                  { value: "morningTraining", label: "Утренняя тренировка" },
                  { value: "training", label: "Тренировка" },
                  { value: "trainingRace", label: "Тренировочная гонка" },
                  { value: "race", label: "Гонка" },
                  { value: "trip", label: "Поход" },
                  { value: "commercial", label: "Коммерческий" },
                  { value: "ladoga", label: "Ладога" },
                ].map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Дата */}
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4 inline mr-1" />
                Дата
              </label>
              <input
                type="date"
                value={newTripDate}
                onChange={(e) => setNewTripDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Время */}
            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                <Clock className="w-4 h-4 inline mr-1" />
                Время
              </label>
              <div className="grid grid-cols-3 gap-2">
                {timeOptions.map((time) => (
                  <button
                    key={time}
                    onClick={() => setNewTripTime(time)}
                    className={`p-2 text-sm rounded-lg border transition-colors ${
                      newTripTime === time
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <input
                  type="time"
                  value={newTripTime}
                  onChange={(e) => setNewTripTime(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  // Сбрасываем форму при отмене
                  const today = new Date();
                  setNewTripDate(today.toISOString().split('T')[0]);
                  setNewTripTime("10:00");
                  setNewTripType("training");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateTrip}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
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