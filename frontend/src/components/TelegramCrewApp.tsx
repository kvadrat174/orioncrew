import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  Ship,
  Clock,
  Phone,
  MapPin,
  User,
} from "lucide-react";
import WebApp from "@twa-dev/sdk";

interface CrewMember {
  id: number;
  name: string;
  position: string;
  phone?: string;
  experience: string;
}

interface SeaTrip {
  date: string;
  crew: CrewMember[];
  vessel: string;
  departure: string;
  estimatedReturn: string;
  destination: string;
  status: "planned" | "active" | "completed";
}

const TelegramCrewApp: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [seaTrips, setSeaTrips] = useState<SeaTrip[]>([]);
  const [tgUser, setTgUser] = useState<any>(null);
  const [tg, setTg] = useState<any>(null);

  useEffect(() => {
    WebApp.ready(); // Инициализация Telegram Web App SDK
  }, []);

  // Инициализация Telegram WebApp
  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const telegramApp = window.Telegram.WebApp;
      setTg(telegramApp);
      setTgUser(telegramApp.initDataUnsafe?.user);

      telegramApp.ready();
      telegramApp.expand();

      // Настройка темы
      const isDark = telegramApp.colorScheme === "dark";
      document.body.style.backgroundColor =
        telegramApp.backgroundColor || (isDark ? "#1f2937" : "#ffffff");
      document.body.style.color =
        telegramApp.textColor || (isDark ? "#ffffff" : "#000000");

      // Настройка заголовка
      telegramApp.MainButton.setText("Обновить данные");
      telegramApp.MainButton.onClick(() => {
        // Здесь можно добавить логику обновления данных
        telegramApp.showAlert("Данные обновлены!");
      });

      if (seaTrips.length > 0) {
        telegramApp.MainButton.show();
      }
    }
  }, [seaTrips]);

  // Загрузка данных (в реальном приложении это будет API)
  useEffect(() => {
    const mockData: SeaTrip[] = [
      {
        date: "2025-06-08",
        vessel: "Морской Волк",
        departure: "06:00",
        estimatedReturn: "18:00",
        destination: "Северная банка",
        status: "planned",
        crew: [
          {
            id: 1,
            name: "Иван Петров",
            position: "Капитан",
            phone: "+7-911-123-45-67",
            experience: "15 лет",
          },
          {
            id: 2,
            name: "Алексей Морозов",
            position: "Помощник капитана",
            phone: "+7-911-234-56-78",
            experience: "8 лет",
          },
          {
            id: 3,
            name: "Сергей Волков",
            position: "Механик",
            phone: "+7-911-345-67-89",
            experience: "12 лет",
          },
          {
            id: 4,
            name: "Дмитрий Белов",
            position: "Рыбак",
            experience: "5 лет",
          },
        ],
      },
      {
        date: "2025-06-10",
        vessel: "Удача",
        departure: "05:30",
        estimatedReturn: "19:00",
        destination: "Восточная зона",
        status: "planned",
        crew: [
          {
            id: 5,
            name: "Николай Козлов",
            position: "Капитан",
            phone: "+7-911-456-78-90",
            experience: "20 лет",
          },
          {
            id: 6,
            name: "Андрей Рыбин",
            position: "Боцман",
            phone: "+7-911-567-89-01",
            experience: "10 лет",
          },
          {
            id: 7,
            name: "Михаил Морской",
            position: "Рыбак",
            experience: "7 лет",
          },
          {
            id: 8,
            name: "Олег Штормов",
            position: "Рыбак",
            experience: "3 года",
          },
        ],
      },
      {
        date: "2025-06-12",
        vessel: "Нептун",
        departure: "07:00",
        estimatedReturn: "17:30",
        destination: "Южная акватория",
        status: "planned",
        crew: [
          {
            id: 9,
            name: "Владимир Океанов",
            position: "Капитан",
            phone: "+7-911-678-90-12",
            experience: "18 лет",
          },
          {
            id: 10,
            name: "Евгений Приливов",
            position: "Механик",
            phone: "+7-911-789-01-23",
            experience: "14 лет",
          },
          {
            id: 11,
            name: "Артем Глубинов",
            position: "Рыбак",
            experience: "6 лет",
          },
        ],
      },
    ];
    setSeaTrips(mockData);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Пустые дни в начале месяца
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
  };

  const getTripForDate = (dateString: string) => {
    return seaTrips.find((trip) => trip.date === dateString);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned":
        return "bg-blue-100 text-blue-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "planned":
        return "Запланировано";
      case "active":
        return "В море";
      case "completed":
        return "Завершено";
      default:
        return "Неизвестно";
    }
  };

  const days = getDaysInMonth(currentMonth);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const selectedTrip = selectedDate ? getTripForDate(selectedDate) : null;

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

  const weekDays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

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
                return <div key={index} className="p-2"></div>;
              }

              const dateString = formatDate(year, month, day);
              const trip = getTripForDate(dateString);
              const isSelected = selectedDate === dateString;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateString)}
                  className={`
                    relative p-2 text-center rounded-lg transition-colors
                    ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-100"
                    }
                    ${trip ? "font-bold" : ""}
                  `}
                >
                  {day}
                  {trip && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Детали выбранного дня */}
        {selectedTrip && (
          <div className="border-t bg-gray-50 p-4">
            <div className="space-y-4">
              {/* Информация о рейсе */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Ship className="w-5 h-5 mr-2 text-blue-600" />
                    {selectedTrip.vessel}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      selectedTrip.status
                    )}`}
                  >
                    {getStatusText(selectedTrip.status)}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>
                      Выход: {selectedTrip.departure} | Возвращение:{" "}
                      {selectedTrip.estimatedReturn}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{selectedTrip.destination}</span>
                  </div>
                </div>
              </div>

              {/* Состав экипажа */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="text-md font-semibold mb-3 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Состав экипажа ({selectedTrip.crew.length} чел.)
                </h4>

                <div className="space-y-3">
                  {selectedTrip.crew.map((member) => (
                    <div
                      key={member.id}
                      className="border-l-4 border-blue-600 pl-3 py-2"
                    >
                      <div className="font-medium text-gray-900">
                        {member.name}
                      </div>
                      <div className="text-sm text-blue-600 font-medium">
                        {member.position}
                      </div>
                      <div className="text-sm text-gray-500">
                        Опыт: {member.experience}
                      </div>
                      {member.phone && (
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Phone className="w-3 h-3 mr-1" />
                          <a
                            href={`tel:${member.phone}`}
                            className="hover:text-blue-600"
                          >
                            {member.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Сообщение когда день не выбран */}
        {!selectedDate && (
          <div className="border-t bg-gray-50 p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Выберите дату для просмотра состава экипажа</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TelegramCrewApp;
