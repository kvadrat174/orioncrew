import React, { useState, useEffect } from "react";
import { Sailboat} from "lucide-react";
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
const BASE_URL = "https://crew.mysailing.ru/api";
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
      const response = await axios.get<SeaTrip[]>(`${BASE_URL}/trips`);
      setSeaTrips(response.data);
    } catch (error) {
      console.error("Ошибка при загрузке данных о рейсах:", error);
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
    if (!tgUser) return;

    setActionLoading({ tripId, memberId: memberId || null });

    try {
      let response;
      if (action === "add") {
        response = await axios.post(`${BASE_URL}/trips/join`, {
          tripId: tripId,
          userId: String(memberId),
          byCaptain,
        });
      } else {
        response = await axios.post(`${BASE_URL}/trips/leave`, {
          tripId: tripId,
          userId: String(memberId),
          byCaptain,
        });
      }

      setSeaTrips(response.data);
    } catch (error) {
      console.error("Ошибка при изменении состава экипажа:", error);
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("Произошла ошибка. Попробуйте позже.");
      }
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
          selectedTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              isCaptain={isCaptain}
              isUserInTrip={isUserInTrip(trip)}
              isCrewExpanded={expandedCrew.has(trip.id)}
              actionLoading={actionLoading}
              onToggleCrewExpanded={() => toggleCrewExpanded(trip.id)}
              onJoinLeave={(action) =>
                handleCrewAction(trip.id, action, String(tgUser!.id))
              }
              onRemoveMember={(memberId) =>
                handleCrewAction(trip.id, "remove", memberId, true)
              }
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
