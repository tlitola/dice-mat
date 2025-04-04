import { useEffect } from "react";
import { supaBase } from "../../supabase";
import { RealtimeEvent } from "../protocols";

export const useChannel = (
  channelName: string,
  callBacks?: {
    event: string;
    callBack: (event: RealtimeEvent) => void;
  }[],
) => {
  if (!supaBase) throw new Error("subabase client must be defined");
  let channel = supaBase.channel(channelName, {
    config: { broadcast: { self: false } },
  });
  useEffect(() => {
    callBacks?.forEach((callBack) => {
      //We can ignore the eslint warning as it is enough, that the listeners are registered once
      //Supabase doesn't require us to return same instance of channel each time
      //eslint-disable-next-line react-hooks/exhaustive-deps
      channel = channel.on("broadcast", { event: callBack.event }, callBack.callBack);
    });

    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [callBacks, channelName]);

  return channel;
};
