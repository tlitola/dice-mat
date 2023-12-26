"use client";
import { DiceWorldManager } from "@/lib/dice";
import { useChannel } from "@/lib/utils/hooks/useChannel";
import { useLocalStorage } from "@/lib/utils/hooks/useLocalStorage";
import { ThrowEvent } from "@/lib/utils/protocols";
import dynamic from "next/dynamic";
import { SyntheticEvent, useEffect, useRef, useState } from "react";
import {
  adjectives,
  animals,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { RollLogEntry } from "./RollLog";

const RollLog = dynamic(
  () => import("./RollLog").then((module) => module.RollLog),
  { ssr: false }
);

const nameGeneratorConfig = {
  dictionaries: [adjectives, animals],
  separator: "-",
  length: 2,
};

export default function Dice() {
  const [color, setColor] = useLocalStorage("die_color", "#ff0000");
  const [textColor, setTextColor] = useLocalStorage(
    "die_text_color",
    "#000000"
  );
  const [name, setName] = useLocalStorage(
    "name",
    uniqueNamesGenerator(nameGeneratorConfig)
  );
  const [group, setGroup] = useLocalStorage("group", "public");

  const [rollHistory, setRollHistory] = useState<RollLogEntry[]>([]);

  const ref = useRef<HTMLDivElement>(null);
  const [diceManager, _] = useState(new DiceWorldManager());

  useEffect(() => {
    const initializeDiceManager = async () => {
      if (ref.current) {
        await diceManager.init(ref.current);
        diceManager.animate();
      }
    };
    initializeDiceManager();

    //Set dicemanager parameters
    diceManager.setColor(color);
    diceManager.setTextColor(textColor);

  }, [ref, diceManager, throwsChannel, name, color, textColor]);

  const handleRoll = async (e: SyntheticEvent) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      roll: { value: string };
      share: { value: boolean };
    };
    const roll = await diceManager.throwDice(target.roll.value || "2d6", {
      shouldBeforeRollRun: target.share.value,
    });
    if (roll.status === "ok") {
      setRollHistory((history) => [
        ...history,
        { thrower: "You", visible: true, roll: roll.data },
      ]);
    }
  };

  return (
    <>
      <div
        ref={ref}
        id="dice-mat"
        className="fixed top-0 right-0 left-0 bottom-0"
      />
      <div className="fixed top-0 left-0">
        <label>Name:</label>
        <input
          className="bg-transparent"
          onChange={(e) => setName(e.currentTarget.value ?? "")}
          value={name}
          onBlur={(e) => e.target.value === "" && setName(undefined)}
        />
        <label title="Throws are shared between people in same group">
          Group:
        </label>
        <input
          className="bg-transparent"
          onChange={(e) => setGroup(e.currentTarget.value ?? "")}
          value={group}
          onBlur={(e) => e.target.value === "" && setGroup(undefined)}
        />
      </div>

      <div className="absolute z-10 top-[90%] flex flex-col items-center left-1/2 -translate-x-1/2">
        <form id="roll" className="flex items-center " onSubmit={handleRoll}>
          <input
            placeholder="eg. 2d6"
            className="border-2 border-slate-500 p-2 text-black"
            name="roll"
            type="text"
          />
          <div className="flex flex-col mx-4">
            <input
              className="h-5 w-5 bg-transparent"
              type="color"
              value={color as string}
              onChange={(e) => setColor(e.target.value)}
            />
            <input
              className="h-5 w-5 bg-transparent"
              type="color"
              value={textColor as string}
              onChange={(e) => setTextColor(e.target.value)}
            />
          </div>

          <button
            className="rounded-md p-3 bg-rose-700 w-20 font-bold text-slate-200"
            type="submit"
          >
            Roll
          </button>
          <div className="mx-2 flex flex-col items-center">
            <p>Share?</p>
            <input defaultChecked={true} name="share" type="checkbox" />
          </div>
        </form>
        <p className="text-sm font-light text-rose-600 m-2" id="message" />
      </div>
      <RollLog history={rollHistory} />
    </>
  );
}
