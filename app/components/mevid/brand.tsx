import { Aperture } from "lucide-react";

export function Brand() {
  return (
    <div className="flex items-center gap-3" aria-label="MeVid">
      <div className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#252334] shadow-[0_8px_20px_rgba(36,29,80,.2)]">
        <Aperture size={21} strokeWidth={2.4} className="text-white" />
      </div>
      <span className="font-display text-[20px] font-bold tracking-[-0.06em] text-[#242432] dark:text-[#f2f0f8]">MeVid</span>
    </div>
  );
}
