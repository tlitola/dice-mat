"use client";
import { Roll } from "@/lib/dice";
import { UIEvent, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown, faDiceD20, faHourglassHalf } from "@fortawesome/free-solid-svg-icons";
import { arraySum } from "@/lib/utils/utils";

export interface RollLogEntry {
  thrower: string;
  roll: Roll[];
  visible: boolean;
}

export function RollLog({ history }: { history: RollLogEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(true);
  const [scrollToBottom, setScrollToBottom] = useState(false);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    debouncedScroll(e.currentTarget);
  };

  const debouncedScroll = useRef(
    debounce((el: HTMLDivElement) => {
      setScrollToBottom(el.scrollTop !== 0);
    }, 500),
  ).current;

  return (
    <div
      className={`${history.length === 0 && "hidden"}
      ${
        !show && "translate-x-full"
      } fixed bottom-[10%] right-0 transition-transform duration-500 group hover:bg-black/50`}
    >
      {/* Logo */}
      <FontAwesomeIcon
        icon={faDiceD20}
        className="text-3xl absolute left-1/2 -translate-x-1/2 -top-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-gray-200 shadow-lg"
      />
      {/* Border */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity h-[2px] w-full bg-gradient-to-r from-yellow-700 from-20% via-50% via-transparent to-80% to-yellow-700" />
      <div className="opacity-0 group-hover:opacity-100 transition-opacity h-[2px] w-full bg-gradient-to-r from-gray-800 from-20% via-50% via-transparent to-80% to-gray-800 mb-2" />

      {/* Container */}
      <div
        onScroll={handleScroll}
        ref={containerRef}
        className="flex flex-col-reverse overflow-y-scroll scroll-smooth px-4 py-2 transition-all w-96 max-h-32 group-hover:max-h-72 "
      >
        <ol className="list-none">
          {history.map((el, i) => (
            <li key={`throw-${i}`}>{createRollLogEntry(el)}</li>
          ))}
        </ol>
      </div>

      {/* Border */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-yellow-700 h-[2px] w-full border-t border-gray-700" />

      {/* Scroll to bottom */}
      <button
        title="Scroll to bottom"
        tabIndex={-1}
        onClick={() => containerRef.current?.scrollTo({ top: 0 })}
        className={`${!scrollToBottom && "!hidden"} absolute bottom-2 right-4 rounded-full shadow-xl saturate-[75%]`}
      >
        <div
          style={{ boxShadow: "inset 0px 0px 5px black" }}
          className="px-3 py-1 rounded-full bg-yellow-900 flex border border-amber-200/50"
        >
          <p className="mr-2 my-auto text-amber-100">Latest</p>
          <FontAwesomeIcon className={` text-amber-200 text-md my-auto`} icon={faCaretDown} />
        </div>
      </button>

      {/* Open / close */}
      <button
        tabIndex={-1}
        className={`${
          show && "!opacity-0 group-hover:!opacity-100"
        } transition-all absolute bottom-2 -left-11 pr-1 m-auto rounded-full shadow-xl saturate-[75%]`}
        onClick={() => setShow((prev) => !prev)}
      >
        <div
          style={{ boxShadow: "inset 0px 0px 5px black" }}
          className="h-10 w-10 p-1 grid place-content-center rounded-full bg-yellow-900 border border-amber-200/50"
        >
          <FontAwesomeIcon icon={faHourglassHalf} className=" text-xl text-amber-200" />
        </div>
      </button>
    </div>
  );
}

const createRollLogEntry = (roll: RollLogEntry) => {
  const rollsByType = roll.roll.reduce(
    (acc, cur) => {
      acc[cur.dice] = (acc[cur.dice] ?? []).concat([cur.value]);
      return acc;
    },
    {} as { [key: number]: number[] },
  );

  return (
    <span className={`${!roll.visible && "hidden"}`}>
      <span className={`${roll.thrower === "You" ? "text-green-400" : "text-sky-400"}`}>{roll.thrower}</span>
      <span className="text-gray-300"> threw {getRolledDiceString(rollsByType)}: </span>
      <span className="text-white">{getRolledValuesString(rollsByType)}</span>
    </span>
  );
};

const getRolledDiceString = (rolls: { [key: number]: number[] }) => {
  return Object.entries(rolls)
    .map(([dice, values]) => `${values.length}d${dice}`)
    .join(", ")
    .replace(/(, )(?!.*\1)/, " and ");
};

const getRolledValuesString = (rolls: { [key: number]: number[] }) => {
  const values = Object.values(rolls);
  return (
    values.reduce((acc, values) => acc + values.join(", ") + "; ", "").slice(0, -2) +
    " " +
    `(${values.reduce((acc, cur) => acc + arraySum(cur), 0)})`
  );
};
