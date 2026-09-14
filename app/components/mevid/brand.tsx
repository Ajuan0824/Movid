import { Aperture } from "lucide-react";
export function Brand() {
  return <div className="flex items-center gap-2.5" aria-label="MoVid">
    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#25352d] text-[#d4ed8a]"><Aperture size={25} strokeWidth={1.6} /></span>
    <span className="font-display text-[25px] font-semibold tracking-[-.07em]">MoVid<span className="text-[#839957]">.</span></span>
  </div>;
}
