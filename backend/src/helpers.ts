import { SeaTrip } from "./Trips";

export const getTypeText = (type: SeaTrip["type"]) => {
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