import { Roll } from "../dice";

export interface ThrowEvent {
  event: "throw";
  payload: { roll: Roll[]; name: string };
  type: "broadcast";
}
