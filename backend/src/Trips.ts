import schedule from "node-schedule";
import { getColumnLetter, getSheetData, updateCell } from "./google";
import { randomUUID } from "crypto";
import { SHEET_ID, SHEET_NAME, invertedParticipantsMap, participantsMap } from "./constants";

export type TripsService = Awaited<ReturnType<typeof create>>;

type TMonthsMap = Map<string, { from: number; to: number }>;
type TActivityMapWithParticipants = Map<
  number,
  { id: string; date: string; activityType: string; participants: string[] }
>;

interface CrewMember {
  id: number;
  name: string;
  position: string;
  phone?: string;
  experience: string;
}

export interface SeaTrip {
  id: string;
  type:
    | "morningTraining"
    | "training"
    | "trainingrace"
    | "race"
    | "trip"
    | "commercial"
    | "ladoga";
  date: string;
  crew: CrewMember[];
  vessel: string;
  departure: string;
  duration: string;
  status: "planned" | "active" | "completed" | "canceled";
}

interface ActivityRegistration {
    id: string;
  date: string;
  activityType: string;
  participants: string[];
}

const create = async () => {
  // Локальное хранилище данных
  let currentTrips: SeaTrip[] = [];
  let lastUpdated: Date | null = null;

  // Функция для получения текущих поездок
  const getTrips = (): SeaTrip[] => {
    return [...currentTrips]; // возвращаем копию массива
  };

  // Функция для получения информации о последнем обновлении
  const getLastUpdated = (): Date | null => {
    return lastUpdated;
  };

  // Функция для обновления данных
  const updateTrips = async (): Promise<SeaTrip[]> => {
    try {
      console.log("=== Fetching CSV...");
      //   const csvText = await downloadCsvFile()
      const registrations = await parseData();
      const seaTrips = transformToSeaTrips(registrations);

      // Обновляем локальное хранилище
      currentTrips = seaTrips;
      lastUpdated = new Date();

      console.log(
        `=== Updated ${seaTrips.length} trips at ${lastUpdated.toISOString()}`
      );
      return seaTrips;
    } catch (error) {
      console.error("Error updating trips:", error);
      throw error;
    }
  };

  // Инициализируем данные при создании сервиса
  console.log("=== Initial trips update...");
  await updateTrips();

  // Настраиваем cron job для обновления каждую минуту
  const job = schedule.scheduleJob("*/5 * * * *", async function () {
    try {
      await updateTrips();
    } catch (error) {
      console.error("Cron job error:", error);
    }
  });


function parseMonths(monthsRow: string[]): TMonthsMap {
  const monthsMap: TMonthsMap = new Map();

  let currentMonth: string | null = null;
  let startCol: number | null = null;

  for (let colIndex = 0; colIndex < monthsRow.length; colIndex++) {
    const month = monthsRow[colIndex].trim();

    if (month) {
      if (currentMonth !== null && startCol !== null) {
        monthsMap.set(currentMonth, {
          from: startCol,
          to: colIndex - 1,
        });
      }

      currentMonth = month.toLowerCase();
      startCol = colIndex;
    }
  }
  if (currentMonth !== null && startCol !== null) {
    monthsMap.set(currentMonth, {
      from: startCol,
      to: monthsRow.length - 1,
    });
  }

  return monthsMap;
}

async function parseDates(
  monthsMap: TMonthsMap,
  idsRow: string[],
  daysRow: string[],
  activitiesRow: string[]
): Promise<TActivityMapWithParticipants> {
  const result: TActivityMapWithParticipants = new Map();

  for (const [monthName, columnRange] of monthsMap.entries()) {
    const monthNumber = getMonthNumber(monthName);
    if (!monthNumber) continue;

    // Проходим по всем колонкам этого месяца
    for (let i = columnRange.from; i <= columnRange.to; i++) {
      const dayStr = daysRow[i];
      const activity = activitiesRow[i];
      let uuidStr = idsRow[i];

      // Пропускаем если нет активности
      if (!activity || activity.trim() === "") {
        // очищаем если удалили активность
        if (uuidStr) {
          const columnLetter = getColumnLetter(i + 1);
          const range = `${SHEET_NAME}!${columnLetter}5`;
          try {
            await updateCell(SHEET_ID, range, '');
          } catch (error) {
            console.error(`Failed to update cell ${range} with UUID:`, error);
          }
        }
        continue;
      };

      if (!uuidStr || uuidStr.trim() === "") {
        uuidStr = randomUUID();

        const columnLetter = getColumnLetter(i + 1); // +1 если индексация с 0
        const range = `${SHEET_NAME}!${columnLetter}5`;
        try {
          await updateCell(SHEET_ID, range, uuidStr);
        } catch (error) {
          console.error(`Failed to update cell ${range} with UUID:`, error);
        }
      }

      // Парсим день и формируем дату
      const day = parseInt(dayStr, 10);
      if (isNaN(day) || day < 1 || day > 31) continue;

      const dayPadded = day.toString().padStart(2, "0");
      const dateStr = `2025-${monthNumber}-${dayPadded}`; // Год можно сделать параметром если нужно

      result.set(i, {
        id: uuidStr,
        date: dateStr,
        activityType: activity.trim(),
        participants: [],
      });
    }
  }

  return result;
}

function parseCrewParticipation(
  activitiesMap: TActivityMapWithParticipants,
  crewData: string[][],
  firstDataRowIndex: number = 1
): TActivityMapWithParticipants {
  // Создаем копию исходной карты, чтобы не мутировать оригинал
  const result = new Map(activitiesMap);

  // Инициализируем массивы participants для каждой записи, если их еще нет
  result.forEach((value, key) => {
    if (!value.participants) {
      value.participants = [];
    }
  });

  // Проходим по всем строкам экипажа (пропускаем заголовки, начиная с firstDataRowIndex)
  for (let rowIndex = 0; rowIndex < crewData.length; rowIndex++) {
    const row = crewData[rowIndex];
    if (!row || row.length === 0) continue;

    const crewName = row[0]?.trim();
    if (!crewName) continue; // Пропускаем строки без ФИО

    // Проходим по всем колонкам в строке (начиная с 1, так как 0 - это ФИО)
    for (let colIndex = 1; colIndex < row.length; colIndex++) {
      const participationMark = row[colIndex];

      // Если в ячейке стоит "1" и такая активность есть в нашей карте
      if (participationMark === "1" && result.has(colIndex)) {
        const activity = result.get(colIndex);
        if (activity && !activity.participants.includes(crewName)) {
          activity.participants.push(crewName);
        }
      }
    }
  }

  return result;
}

async function parseData(): Promise<ActivityRegistration[]> {
  const rawRows: string[][] = await getSheetData();
  const monthsMapped = parseMonths(rawRows[0]);
  const filledDates = await parseDates(
    monthsMapped,
    rawRows[4],
    rawRows[2],
    rawRows[5]
  );
  const crewParticipationMap = parseCrewParticipation(
    filledDates,
    rawRows.slice(8, 39)
  );

  return Array.from(crewParticipationMap.values());
}

function getMonthNumber(monthName: string): string | null {
  const map: Record<string, string> = {
    январь: "01",
    февраль: "02",
    март: "03",
    апрель: "04",
    май: "05",
    июнь: "06",
    июль: "07",
    август: "08",
    сентябрь: "09",
    октябрь: "10",
    ноябрь: "11",
    декабрь: "12",
  };

  return map[monthName.toLowerCase().replace(/[^а-яё]/gi, "")] || null;
}

// Дополнительная функция для группировки по дате
function groupByDate(
  registrations: ActivityRegistration[]
): Record<string, ActivityRegistration[]> {
  return registrations.reduce((acc, registration) => {
    if (!acc[registration.date]) {
      acc[registration.date] = [];
    }
    acc[registration.date].push(registration);
    return acc;
  }, {} as Record<string, ActivityRegistration[]>);
}

// Дополнительная функция для группировки по типу активности
function groupByActivity(
  registrations: ActivityRegistration[]
): Record<string, ActivityRegistration[]> {
  return registrations.reduce((acc, registration) => {
    if (!acc[registration.activityType]) {
      acc[registration.activityType] = [];
    }
    acc[registration.activityType].push(registration);
    return acc;
  }, {} as Record<string, ActivityRegistration[]>);
}

function transformToSeaTrips(registrations: ActivityRegistration[]): SeaTrip[] {
  const seaTrips: SeaTrip[] = [];
  let memberId = 1;
  for (const registration of registrations) {
    // Преобразуем тип активности
    const activityType = mapActivityType(registration.activityType);
    if (!activityType) continue;

    // Создаем экипаж из участников
    const crew: CrewMember[] = registration.participants.map((name) => ({
      id: invertedParticipantsMap[name],
      name: name,
      position: name === "Курочкина Ольга" ? "Боцман" : "Матрос", // можно добавить логику определения должности
      experience: "Не указан", // можно добавить логику определения опыта
    }));

    // Определяем время в зависимости от типа активности
    const duration = getDefaultDuration(activityType);
    const { departure } = getDefaultSchedule(activityType);

    const seaTrip: SeaTrip = {
      id: registration.id,
      type: activityType,
      date: registration.date,
      crew: crew,
      vessel: "Орион",
      departure: departure,
      status: new Date(registration.date) > new Date() ? "planned" : "completed",
      duration: duration
    };

    seaTrips.push(seaTrip);
  }
  return seaTrips.sort((a, b) => a.date.localeCompare(b.date));
}

function mapActivityType(csvType: string): SeaTrip["type"] | null {
  const typeMap: Record<string, SeaTrip["type"]> = {
    УТ: "morningTraining",
    Т: "training",
    ТГ: "trainingrace",
    Г: "race",
    П: "trip",
    К: "commercial",
    Л: "ladoga",
  };

  return typeMap[csvType] || null;
}

function getDefaultPosition(name: string): string {
  // Простая логика - можно расширить
  const positions = ["Рыбак", "Боцман", "Механик", "Капитан"];
  return positions[Math.floor(Math.random() * positions.length)];
}

function getDefaultDuration(activityType: SeaTrip["type"]): string {
  const timeMap: Record<SeaTrip["type"], string> = {
    morningTraining: "3ч",
    training: "3ч",
    trainingrace: "5ч",
    race: "5ч",
    trip: "3д",
    commercial: "3ч",
    ladoga: "3д",
  };

  return timeMap[activityType];
}

function getDefaultSchedule(activityType: SeaTrip["type"]): {
  departure: string;
} {
  const scheduleMap: Record<
    SeaTrip["type"],
    { departure: string }
  > = {
    morningTraining: { departure: "06:00" },
    training: { departure: "19:00" },
    trainingrace: { departure: "18:30" },
    race: { departure: "10:00" },
    trip: { departure: "08:30" },
    commercial: { departure: "06:30" },
    ladoga: { departure: "05:00" },
  };

  return scheduleMap[activityType];
}

async function updateParticipant(userId: string, tripId: string, value: string) {
  const rawRows: string[][] = await getSheetData();
  const participantName: string = participantsMap[userId];
  let participantRowIndex = -1;
  rawRows.forEach((row, i) => {
    if(row[0] === participantName) {
      participantRowIndex = i
    }
  })
  const tripIndex = rawRows[4].findIndex((id) => id === tripId)
  if(tripIndex === -1) {
    throw Error('No such trip')
  }

  if(participantRowIndex === -1) {
    throw Error('No such participant')
  }

  const columnLetter = getColumnLetter(tripIndex + 1);
  const range = `${SHEET_NAME}!${columnLetter}${participantRowIndex + 1}`;

  try {
    await updateCell(SHEET_ID, range, value);
    await updateTrips();
  } catch (error) {
    console.error(`Failed to update cell ${range} with UUID:`, error);
  }
}
  // Возвращаем API сервиса
  return {
    getTrips,
    getLastUpdated,
    updateParticipant,
    updateTrips,
    stop: () => {
      if (job) {
        job.cancel();
        console.log("=== Trips service stopped");
      }
    },
  };
};

export default { create };
