import dynamic from "next/dynamic";

const Dice = dynamic(() => import("../components/Dice").then((module) => module.default), { ssr: false });

export default function Home() {
  return <Dice />;
}
