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

// для пуша в гит
export const BASE_URL = "https://crew.mysailing.ru/api";
// для разработки фронта
// const BASE_URL = "http://localhost:3500";

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

  // Хендлер на прошлый месяц
  const handlePrevMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    setCurrentMonth(new Date(year, month - 1));
  };

  // Хендлер на следующий месяц
  const handleNextMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    setCurrentMonth(new Date(year, month + 1));
  };

  // Тоггл на развертывание списка команды
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

  // Хендлер на действия пользователя
  const handleCrewAction = async (
    tripId: string,
    action: "add" | "remove",
    memberId?: string,
    byCaptain = false
  ) => {
    if (!tgUser) {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("Пользователь не авторизован");
      }
      return;
    }

    // Для мягкого удаления и восстановления
    if (byCaptain) {
      if (action === "remove") {
        const isSoftRemoved = softRemovedMembers[tripId]?.includes(memberId!);

        if (isSoftRemoved) {
          // Восстановление участника
          setSoftRemovedMembers((prev) => ({
            ...prev,
            [tripId]: prev[tripId].filter((id) => id !== memberId),
          }));
          return;
        } else {
          // Мягкое удаление
          setSoftRemovedMembers((prev) => ({
            ...prev,
            [tripId]: [...(prev[tripId] || []), memberId!],
          }));
          return;
        }
      }
    }

    // Состояние загрузки для конкретной кнопки
    setActionLoading({ tripId, memberId: memberId || null });

    try {
      const endpoint = action === "add" ? "join" : "leave";
      const payload = {
        tripId: tripId,
        userId: String(memberId || tgUser.id), // Используем memberId или tgUser.id
        byCaptain,
      };

      const response = await axios.post(
        `${BASE_URL}/trips/${endpoint}`,
        payload
      );

      // Обновляем данные только при успешном запросе
      setSeaTrips(response.data);

      // Показываем уведомление об успехе в Telegram
      if (window.Telegram?.WebApp) {
        const actionName = action === "add" ? "записан" : "выписан";
        window.Telegram.WebApp.showAlert(
          `Успешно! Пользователь ${actionName}.`
        );
      }
    } catch (error) {
      console.error("Ошибка при изменении состава экипажа:", error);

      // Показываем разные сообщения об ошибках
      let errorMessage = "Произошла ошибка. Попробуйте позже.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }

      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(errorMessage);
      }
    } finally {
      // Сбрасываем состояние загрузки независимо от результата
      setActionLoading({ tripId: null, memberId: null });
    }
  };

  // Функции для подтверждения удаления
  const confirmRemoval = async (tripId: string) => {
    if (!softRemovedMembers[tripId]?.length) return;

    try {
      setActionLoading({ tripId, memberId: null });

      // Отправляем запрос на удаление для каждого участника
      await Promise.all(
        softRemovedMembers[tripId].map((memberId) =>
          axios.post(`${BASE_URL}/trips/leave`, {
            tripId,
            userId: memberId,
            byCaptain: true,
          })
        )
      );

      // Обновляем данные и очищаем мягко удаленных
      const response = await axios.get<SeaTrip[]>(`${BASE_URL}/trips`);
      setSeaTrips(response.data);
      setSoftRemovedMembers((prev) => ({ ...prev, [tripId]: [] }));

      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("Удаление подтверждено!");
      }
    } catch (error) {
      console.error("Ошибка при подтверждении удаления:", error);
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("Ошибка при удалении участников");
      }
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

      // Очищаем мягко удаленных при успешном добавлении
      setSoftRemovedMembers((prev) => ({
        ...prev,
        [tripId]: prev[tripId]?.filter((id) => id !== memberId) || [],
      }));

      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("Участник успешно добавлен!");
      }
    } catch (error) {
      console.error("Ошибка при добавлении участника:", error);
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(
          axios.isAxiosError(error)
            ? error.response?.data?.message || "Не удалось добавить участника"
            : "Не удалось добавить участника"
        );
      }
    } finally {
      setActionLoading({ tripId: null, memberId: null });
    }
  };

  // Метод получения выходов в дату
  const getTripsForDate = (dateString: string) => {
    return seaTrips.filter((trip) => trip.date === dateString);
  };

  // Проверка на капитана
  const isCaptain = tgUser?.id === CAPTAIN_ID;

  // Проверка на пользователя в списке выхода
  const isUserInTrip = (trip: SeaTrip) => {
    if (!tgUser) return false;

    return trip.crew.some((member) => member.id === String(tgUser.id));
  };

  // Дни в календаре
  const days = getDaysInMonth(currentMonth);

  // Выходы на выбранную дату
  const selectedTrips = selectedDate ? getTripsForDate(selectedDate) : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Заголовок */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sailboat className="w-6 h-6" />
              <h1 className="text-xl font-bold">Календарь экипажа</h1>
            </div>
            {tgUser && <UserBadge tgUser={tgUser} isCaptain={isCaptain} />}
          </div>
        </div>

        {/* Навигация по месяцам */}
        <CalendarHeader
          currentMonth={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />

        {/* Календарь */}
        <CalendarGrid
          currentMonth={currentMonth}
          days={days}
          seaTrips={seaTrips}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        {/* Детали выбранного дня */}
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
                  setSoftRemovedMembers((prev) => ({ ...prev, [trip.id]: [] }))
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
    </div>
  );
};

export default TelegramCrewApp;
