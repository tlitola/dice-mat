import { useEffect } from "react";
import { supaBase } from "../../supabase";

export const useChannel = (channelName: string, callBacks?: { event: string; callBack: (event: any) => any }[]) => {
  let channel = supaBase.channel(channelName, {
    config: { broadcast: { self: false } },
  });
  useEffect(() => {
    callBacks?.forEach((callBack) => {
      //We can ignore the eslint warning as it is enough, that the listeners are registered once
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
