/* Член экипажа */
export interface CrewMember {
  id: string;
  name: string;
  position: string;
  phone?: string;
  experience: string;
  tgId?: number;
}

/* Тип выхода */
export interface SeaTrip {
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
