import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  Ship,
  Clock,
  User,
  Check,
  X,
  Loader2,
} from "lucide-react";
import WebApp from "@twa-dev/sdk";
import type { TgUser } from "../types/telegram";
import axios from "axios";

const BASE_URL = "https://crew.mysailing.ru/api"
// const BASE_URL = "http://localhost:3500"

interface CrewMember {
  id: number;
  name: string;
  position: string;
  phone?: string;
  experience: string;
  tgId?: number;
}

interface SeaTrip {
  id: string;
  type:
    | "morningTraining"
    | "training"
    | "trainingRace"
    | "race"
    | "trip"
    | "commercial"
    | "ladoga";
  date: string;
  crew: CrewMember[];
  vessel: string; // судно
  departure: string; // отправление
  duration: string; // длительность
  status: "planned" | "active" | "completed" | "canceled";
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: typeof WebApp;
    };
  }
}

const CAPTAIN_ID = 715698611; // Замените на реальный ID капитана

const TelegramCrewApp: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [seaTrips, setSeaTrips] = useState<SeaTrip[]>([]);
  const [tgUser, setTgUser] = useState<TgUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<{
    tripId: string | null;
    memberId: number | null;
  }>({ tripId: null, memberId: null });

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
      const response = await axios.get<SeaTrip[]>(
        `${BASE_URL}/trips`
      );
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

  const handleCrewAction = async (
    tripId: string,
    action: "add" | "remove",
    memberId?: number
  ) => {
    if (!tgUser) return;

    setActionLoading({ tripId, memberId: memberId || null });

    try {
      if (action === "add") {
        await axios.post(`${BASE_URL}/trips/join`, {
          tripId: tgUser.id,
          userId: tgUser.id,
        });
      } else {
        await axios.post(
          `${BASE_URL}/trips/leave`,
          {
            tripId: tgUser.id,
            userId: tgUser.id,
          }
        );
      }

      await fetchTrips();
    } catch (error) {
      console.error("Ошибка при изменении состава экипажа:", error);
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("Произошла ошибка. Попробуйте позже.");
      }
    } finally {
      setActionLoading({ tripId: null, memberId: null });
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    let startingDayOfWeek = firstDay.getDay();

    // Преобразование порядка дней недели чтобы понедельник был = 0, а воскресенье = 6
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days = [];

    // Добавление пустых ячеек для дней предыдущего месяца
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getCurrentDate = () => {
    const today = new Date();
    return formatDate(today.getFullYear(), today.getMonth(), today.getDate());
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
  };

  const getTripsForDate = (dateString: string) => {
    return seaTrips.filter((trip) => trip.date === dateString);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned":
        return "bg-blue-100 text-blue-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeText = (type: SeaTrip["type"]) => {
    switch (type) {
      case "morningTraining":
        return "Утренняя тренировка";
      case "training":
        return "Тренировка";
      case "trainingRace":
        return "Тренировочная гонка";
      case "race":
        return "Гонка";
      case "commercial":
        return "Мастер-класс";
      case "trip":
        return "Поход";
      case "ladoga":
        return "Ладога";
      default:
        return "Неизвестно";
    }
  };

  const isCaptain = tgUser?.id === CAPTAIN_ID;
  const isUserInTrip = (trip: SeaTrip) => {
    if (!tgUser) return false;
    return trip.crew.some((member) => member.tgId === tgUser.id);
  };

  const days = getDaysInMonth(currentMonth);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const selectedTrips = selectedDate ? getTripsForDate(selectedDate) : null;

  const monthNames = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ];

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Заголовок */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Ship className="w-6 h-6" />
              <h1 className="text-xl font-bold">Календарь экипажа</h1>
            </div>
            {tgUser && (
              <div className="flex items-center space-x-2 text-sm">
                <User className="w-4 h-4" />
                <span>{tgUser.first_name}</span>
                {isCaptain && (
                  <span className="text-xs bg-yellow-500 px-1 rounded">
                    Капитан
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Навигация по месяцам */}
        <div className="flex items-center justify-between p-4 border-b">
          <button
            onClick={() => setCurrentMonth(new Date(year, month - 1))}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1))}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            →
          </button>
        </div>

        {/* Календарь */}
        <div className="p-4">
          {/* Дни недели */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 p-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Дни месяца */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="p-2"></div>;
              }

              const dateString = formatDate(year, month, day);
              const trips = getTripsForDate(dateString);
              const isSelected = selectedDate === dateString;
              const isToday = dateString === getCurrentDate();

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateString)}
                  className={`
                    relative p-2 text-center rounded-lg transition-colors
                    ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : isToday
                        ? "bg-gray-100 text-gray-800 font-bold border border-gray-300"
                        : "hover:bg-gray-100"
                    }
                    ${trips.length > 0 ? "font-bold" : ""}
                  `}
                >
                  {day}
                  {trips.length > 0 && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                  )}
                  {isToday && !isSelected && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-gray-400 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Детали выбранного дня */}
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : selectedTrips?.length ? (
          selectedTrips.map((trip) => (
            <div key={trip.id} className="border-t bg-gray-50 p-4">
              <div className="space-y-4">
                {/* Информация о рейсе */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Ship className="w-5 h-5 mr-2 text-blue-600" />
                      {trip.vessel}
                    </h3>
                    <div className="flex items-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          trip.status
                        )}`}
                      >
                        {getTypeText(trip.type)}
                      </span>

                      {/* Кнопки записи/выписки для обычных пользователей */}
                      {!isCaptain && (
                        <button
                          onClick={() =>
                            handleCrewAction(
                              trip.id,
                              isUserInTrip(trip) ? "remove" : "add"
                            )
                          }
                          disabled={
                            actionLoading.tripId === trip.id &&
                            actionLoading.memberId === null
                          }
                          className={`ml-2 p-1 rounded-full ${
                            isUserInTrip(trip)
                              ? "bg-red-100 text-red-600 hover:bg-red-200"
                              : "bg-green-100 text-green-600 hover:bg-green-200"
                          }`}
                        >
                          {actionLoading.tripId === trip.id &&
                          actionLoading.memberId === null ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isUserInTrip(trip) ? (
                            <X className="w-4 h-4" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>
                        Выход: {trip.departure}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Состав экипажа */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="text-md font-semibold mb-3 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Состав экипажа ({trip.crew.length} чел.)
                  </h4>

                  <div className="space-y-3">
                    {trip.crew.map((member) => (
                      <div
                        key={member.id}
                        className="border-l-4 border-blue-600 pl-3 py-2 flex justify-between items-start"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {member.name}
                          </div>
                          <div className="text-sm text-blue-600 font-medium">
                            {member.position}
                          </div>
                        </div>

                        {/* Кнопки управления для капитана
                        {isCaptain && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() =>
                                handleCrewAction(trip.id, "remove", member.id)
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
                        )} */}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : !selectedDate ? (
          <div className="border-t bg-gray-50 p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Выберите дату для просмотра состава экипажа</p>
          </div>
        ) : (
          <div className="border-t bg-gray-50 p-8 text-center text-gray-500">
            <Ship className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>На выбранную дату рейсов не запланировано</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelegramCrewApp;