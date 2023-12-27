import { Roll } from "../dice";

export interface ThrowEvent {
  event: "throw";
  payload: {
    roll: Roll[];
    name: string;
    diceColor?: {
      text: string;
      base: string;
    };
  };
  type: "broadcast";
}
