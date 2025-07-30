import { TObject } from "@sinclair/typebox/type";
import { SeaTrip } from "./Types";
import * as t from '@sinclair/typebox/type'

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

export const DObject = <T extends TObject>(schema: T, options = {}): T =>
  t.Object(schema.properties, { default: {}, ...options }) as T

export function createLocalDate(dateStr: string, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(dateStr);
  
  date.setHours(hours, minutes, 0, 0);
  
  return date;
}

export function toMapByProp<T, K extends keyof T>(ar: T[], prop: K): Map<T[K], T> {
  const ret = new Map<T[K], T>()
  ar.forEach(item => ret.set(item[prop], item))
  return ret
}

export function getDefaultDuration(activityType: SeaTrip["type"]): string {
  const timeMap: Record<SeaTrip["type"], string> = {
    morningTraining: "3ч",
    training: "3ч",
    trainingRace: "5ч",
    race: "5ч",
    trip: "3д",
    commercial: "3ч",
    ladoga: "3д",
  };

  return timeMap[activityType];
}