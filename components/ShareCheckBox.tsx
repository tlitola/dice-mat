import { faCloudArrowUp, faSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { HTMLProps, useState } from "react";

export const ShareCheckbox = (props: HTMLProps<HTMLInputElement>) => {
  const [checked, setChecked] = useState(true);
  return (
    <div onClick={() => setChecked((prev) => !prev)} {...props} className="flex group">
      <div className="flex">
        <FontAwesomeIcon icon={faSlash} className={`absolute text-white z-10 !h-6 ${checked && "!hidden"}`} />
        <FontAwesomeIcon
          icon={faSlash}
          className={`absolute text-gray-800 z-10 !h-6 -translate-x-px translate-y-px ${checked && "!hidden"}`}
        />
        <FontAwesomeIcon
          icon={faCloudArrowUp}
          className={`text-white ${
            checked ? "opacity-100 group-hover:opacity-80" : "opacity-40 group-hover:opacity-60"
          } !h-6`}
        />
      </div>
      <input checked={checked} onChange={() => {}} name="share" className="hidden" type="checkbox" />
      <p className="text-sm font-light text-gray-300 absolute translate-x-9 whitespace-nowrap group-hover:block hidden select-none">
        {checked ? "Sharing throws" : "Not sharing throws"}
      </p>
    </div>
  );
};
