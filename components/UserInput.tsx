import { Dispatch, HTMLProps, ReactNode, SetStateAction } from "react";

export const UserInput = ({
  name,
  group,
  setName,
  setGroup,
}: {
  name: string;
  group: string;
  setName: Dispatch<SetStateAction<string | undefined>>;
  setGroup: Dispatch<SetStateAction<string | undefined>>;
}) => {
  return (
    <div className="fixed top-2 left-4">
      <UserDetailLabel>Name:</UserDetailLabel>
      <UserDetailInput
        onChange={(e) => setName(e.currentTarget.value ?? "")}
        value={name}
        onBlur={(e) => e.target.value === "" && setName(undefined)}
        spellCheck="false"
      />
      <UserDetailLabel title="Throws are shared between people in same group">
        Group:
      </UserDetailLabel>
      <UserDetailInput
        onChange={(e) => setGroup(e.currentTarget.value ?? "")}
        value={group}
        onBlur={(e) => e.target.value === "" && setGroup(undefined)}
        spellCheck="false"
      />
    </div>
  );
};

const UserDetailInput = (props: HTMLProps<HTMLInputElement>) => (
  <input
    {...props}
    className="bg-transparent outline-none shadow-none w-32 mr-4 focus:border-b focus:border-b-gray-300 text-gray-200"
  />
);

const UserDetailLabel = (
  props: HTMLProps<HTMLLabelElement> & { children: ReactNode }
) => (
  <label {...props} className="mr-2 font-light text-gray-200">
    {props.children}
  </label>
);
