import { type Static } from '@sinclair/typebox/type'
import * as t from '@sinclair/typebox/type'

export type TMonthsMap = Map<string, { from: number; to: number }>;
export type TActivityMapWithParticipants = Map<
  number,
  { id: string; date: string; activityType: string; participants: string[] }
>;

export interface CrewMember {
  id: string;
  name: string;
  position: string;
  phone?: string;
}

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
  vessel: string;
  departure: string;
  duration: string;
  status: "planned" | "active" | "completed" | "canceled";
}

export interface ActivityRegistration {
    id: string;
  date: string;
  activityType: string;
  participants: string[];
}

export type CrewMemberDto = Static<typeof CrewMemberDto>
export const CrewMemberDto = t.Object({
  id: t.String(),
  name: t.String(),
  position: t.String(),
  phone: t.Optional(t.String()),
})

export type SeaTripDto = Static<typeof SeaTripDto>
export const SeaTripDto = t.Object({
  id: t.String(),
  type: t.Union([
    t.Literal('morningTraining'),
    t.Literal('training'),
    t.Literal('trainingRace'),
    t.Literal('race'),
    t.Literal('trip'),
    t.Literal('commercial'),
    t.Literal('ladoga'),
  ]),
  departure: t.String(),
  date: t.String(),
  crew: t.Array(CrewMemberDto),
  duration: t.String(),
  vessel: t.String(),
  status: t.Union([
    t.Literal('planned'),
    t.Literal('active'),
    t.Literal('completed'),
    t.Literal('canceled'),
  ]),
})