import { Roll } from "../dice";

export interface RealtimeEvent {
  event: string;
  //The payload can be anything the user specifies
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  type: "broadcast" | "postgres_changes" | "precense";
}

export interface ThrowEvent extends RealtimeEvent {
  payload: {
    roll: Roll[];
    name: string;
    diceColor?: {
      text: string;
      base: string;
    };
  };
}
