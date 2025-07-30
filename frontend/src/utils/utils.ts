import type { SeaTrip } from "../interfaces/inrefaces";

/* Метод получения дней в календаре */
export const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  let startingDayOfWeek = firstDay.getDay();

  /* Преобразование порядка дней недели чтобы понедельник был = 0, а воскресенье = 6 */
  startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

  const days = [];

  /* Добавление пустых ячеек для дней предыдущего месяца */
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return days;
};

/* Метод получения текущей даты */
export const getCurrentDate = () => {
  const today = new Date();
  return formatDate(today.getFullYear(), today.getMonth(), today.getDate());
};
/* Форматирование даты */
export const formatDate = (year: number, month: number, day: number) => {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
};

/* Метод для проверки что тренировка еще не началась (для блокировки кнопок "Записаться" и "Выписаться") */
export const isTripInFuture = (tripDate: string, tripTime: string) => {
  const now = new Date();
  const tripDateTime = new Date(`${tripDate}T${tripTime}:00`);
  return tripDateTime > now;
};

/* Метод получения типа выхода */
export const getTypeText = (type: SeaTrip["type"]) => {
  switch (type) {
    case "morningTraining":
      return "Утренняя тренировка";
    case "training":
      return "Вечерняя тренировка";
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

/* Метод получения цветов статуса выхода */
export const getStatusColor = (status: string) => {
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
