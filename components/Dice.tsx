"use client";
import { DiceWorldManager } from "@/lib/dice";
import { useChannel } from "@/lib/utils/hooks/useChannel";
import { useLocalStorage } from "@/lib/utils/hooks/useLocalStorage";
import { ThrowEvent } from "@/lib/utils/protocols";
import dynamic from "next/dynamic";
import { SyntheticEvent, useEffect, useRef, useState } from "react";
import { adjectives, animals, uniqueNamesGenerator } from "unique-names-generator";
import { RollLogEntry } from "./RollLog";
import { UserInput } from "./UserInput";
import { RollInput } from "./RollInput";

const RollLog = dynamic(() => import("./RollLog").then((module) => module.RollLog), { ssr: false });

const nameGeneratorConfig = {
  dictionaries: [adjectives, animals],
  separator: "-",
  length: 2,
};

export default function Dice() {
  const [color, setColor] = useLocalStorage("die_color", "#ff0000");
  const [textColor, setTextColor] = useLocalStorage("die_text_color", "#000000");
  const [name, setName] = useLocalStorage("name", uniqueNamesGenerator(nameGeneratorConfig));
  const [group, setGroup] = useLocalStorage("group", "public");

  const [error, setError] = useState<string | undefined>(undefined);
  const [rollHistory, setRollHistory] = useState<RollLogEntry[]>([]);

  const throwsChannel = useChannel(group + (group.length !== 0 ? "-" : "") + "throws", [
    {
      event: "throw",
      callBack: async (event: ThrowEvent) => {
        //Add the roll to history, still invisible as the roll hasn't played out.
        setRollHistory((history) => [
          ...history,
          {
            thrower: event.payload.name,
            roll: event.payload.roll,
            visible: false,
          },
        ]);

        //Throw the dice and wait them to settle, the throw should succeed as the roll was broadcasted
        const roll = await diceManager.throwDice(event.payload.roll, {
          shouldBeforeRollRun: false,
          diceColor: event.payload.diceColor?.base,
          diceTextColor: event.payload.diceColor?.text,
        });

        //Make all throws visible
        roll.status === "ok" && setRollHistory((history) => history.map((el) => ({ ...el, visible: true })));
      },
    },
  ]);

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

    diceManager.setBeforeRoll((roll) =>
      throwsChannel.send({
        type: "broadcast",
        event: "throw",
        payload: {
          roll,
          name,
          diceColor: {
            base: color,
            text: textColor,
          },
        },
      } satisfies ThrowEvent),
    );
  }, [ref, diceManager, throwsChannel, name, color, textColor]);

  const handleRoll = async (e: SyntheticEvent) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      roll: { value: string };
      share: { checked: boolean };
    };

    setError(undefined);
    const roll = await diceManager.throwDice(target.roll.value || "2d6", {
      shouldBeforeRollRun: target.share.checked,
    });
    if (roll.status === "error") {
      setError(roll.data);
    } else {
      setRollHistory((history) => [...history, { thrower: "You", visible: true, roll: roll.data }]);
    }
  };

  return (
    <>
      <div ref={ref} id="dice-mat" className="fixed top-0 right-0 left-0 bottom-0" />
      <UserInput name={name} setName={setName} group={group} setGroup={setGroup} />

      <RollInput
        handleRoll={handleRoll}
        color={color}
        textColor={textColor}
        setColor={setColor}
        setTextColor={setTextColor}
        error={error}
      />
      <RollLog history={rollHistory} />
    </>
  );
}
