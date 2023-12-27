import { ChangeEventHandler, useRef } from "react";

export const ColorInput = ({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  className: string;
}) => {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div
      style={{ backgroundColor: value }}
      className={"cursor-pointer " + className}
      onClick={() => {
        ref.current?.showPicker();
      }}
    >
      <input className="opacity-0 absolute" ref={ref} type="color" value={value} onChange={onChange} />
    </div>
  );
};
