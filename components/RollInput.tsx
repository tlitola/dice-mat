import { Dispatch, FormEventHandler, SetStateAction } from "react";
import { ColorInput } from "./ColorInput";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDiceD20 } from "@fortawesome/free-solid-svg-icons";
import { ShareCheckbox } from "./ShareCheckBox";

export const RollInput = ({
  handleRoll,
  color,
  textColor,
  setColor,
  setTextColor,
  error,
}: {
  handleRoll: FormEventHandler<HTMLFormElement>;
  color: string;
  textColor: string;
  setColor: Dispatch<SetStateAction<string | undefined>>;
  setTextColor: Dispatch<SetStateAction<string | undefined>>;
  error: string | undefined;
}) => {
  return (
    <div className="absolute top-[90%] flex flex-col items-center left-1/2 -translate-x-1/2">
      <form id="roll" className="flex items-center " onSubmit={handleRoll}>
        {/* Color inputs */}
        <div className="flex flex-col">
          <div className="group ">
            <label className="group-hover:opacity-100 opacity-0 transition-opacity absolute text-sm font-light text-gray-300 -translate-x-full -left-2">
              Dice color
            </label>
            <ColorInput
              className="w-5 h-5 mb-1 rounded"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <div className="group">
            <label className="group-hover:opacity-100 opacity-0 transition-opacity absolute text-sm font-light text-gray-300 -translate-x-full -left-2">
              Dice font color
            </label>
            <ColorInput
              className="w-5 h-5 rounded"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
            />
          </div>
        </div>

        {/* Roll input */}
        <div
          className={`w-52 ml-2 mr-4 p-px border border-transparent focus-within:border-amber-200/50 ${
            error && "!border-rose-500"
          }`}
        >
          <input
            style={{ boxShadow: "inset 0px 0px 2px black" }}
            placeholder="eg. 2d6"
            className="outline-none p-3 bg-zinc-800 text-amber-50/95 placeholder:text-amber-50/75 placeholder:font-light placeholder:italic"
            name="roll"
            type="text"
            autoFocus
          />
          <p
            className={`absolute -bottom-5 text-sm font-light text-rose-500 ${
              !error && "hidden"
            }`}
          >
            {error}
          </p>
        </div>

        {/* Roll button */}
        <button
          title="Scroll to bottom"
          className="mr-4 rounded-full shadow-xl saturate-[75%] hover:saturate-50 focus:saturate-100 active:saturate-100 outline-none outline-offset-0 focus:outline-amber-200/50 "
          type="submit"
        >
          <div
            style={{ boxShadow: "inset 0px 0px 5px black" }}
            className="px-4 py-2 rounded-full bg-yellow-900 flex border border-amber-200/50"
          >
            <p className="my-auto text-amber-100 select-none mr-2">Roll</p>
            <FontAwesomeIcon
              className={` text-amber-200 text-md my-auto`}
              icon={faDiceD20}
            />
          </div>
        </button>

        {/* Share the throw? */}
        <ShareCheckbox title="Check if you wish to broadcast this throw to others in your group" />
      </form>
    </div>
  );
};
