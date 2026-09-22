"use client";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Images,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { AppCopy } from "../../../lib/mevid/copy";
import { RETENTION_DAYS } from "../../../lib/firebase/generations";
import type { StoredGeneration } from "../../../lib/mevid/types";
import { PageHeading, Screen } from "../ui/screen";
import { Sheet } from "../ui/sheet";
const PAGE_SIZE = 4;
const DAY_MS = 86400000;
function relativeDay(copy: AppCopy, date: Date) {
  const today = new Date();
  const days = Math.round(
    (new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    ).getTime() -
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
      DAY_MS,
  );
  return days <= 0
    ? copy.library.today
    : days === 1
      ? copy.library.yesterday
      : copy.library.daysAgo.replace("{days}", String(days));
}
export function MomentsLibrary({
  copy,
  generations,
  onOpen,
  onDelete,
  onGoHome,
}: {
  copy: AppCopy;
  generations: StoredGeneration[];
  onOpen: (generation: StoredGeneration) => void;
  onDelete: (generation: StoredGeneration) => void;
  onGoHome: () => void;
}) {
  const [confirming, setConfirming] = useState<StoredGeneration | null>(null);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(generations.length / PAGE_SIZE));
  // Clamp after deletion so an emptied final page never strands the user.
  const current = Math.min(page, pages - 1);
  const visible = generations.slice(
    current * PAGE_SIZE,
    (current + 1) * PAGE_SIZE,
  );
  if (!generations.length)
    return (
      <Screen>
        <PageHeading
          eyebrow={copy.studio.collection}
          title={copy.library.title}
        />
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="relative mb-9 h-36 w-28">
            <div className="absolute inset-0 rotate-[-12deg] rounded-2xl border border-[var(--line)] bg-[var(--surface)]" />
            <div className="absolute inset-0 grid rotate-[8deg] place-items-center rounded-2xl bg-[#d4ed8a] text-[#466447]">
              <Images size={38} strokeWidth={1} />
            </div>
          </div>
          <h2 className="font-editorial text-3xl">{copy.momentsEmpty.title}</h2>
          <p className="mt-3 max-w-[265px] text-sm leading-6 text-muted">
            {copy.momentsEmpty.description}
          </p>
        </div>
        <button className="primary-button" onClick={onGoHome}>
          {copy.momentsEmpty.cta}
          <ArrowUpRight size={18} />
        </button>
      </Screen>
    );
  return (
    <Screen>
      <PageHeading
        eyebrow={copy.studio.collection}
        title={copy.library.title}
        action={
          <button
            className="icon-button"
            onClick={onGoHome}
            aria-label={copy.results.newVideo}
          >
            <Plus size={20} />
          </button>
        }
      />
      <motion.ul
        key={current}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="library-grid"
      >
        {visible.map((generation) => {
          const left = Math.max(
            0,
            RETENTION_DAYS -
              Math.floor(
                (Date.now() - generation.createdAt.getTime()) / DAY_MS,
              ),
          );
          return (
            <li key={generation.id} className="library-card animated-edge">
              <button
                className="library-cover"
                style={{
                  backgroundImage: `url("${generation.highlights[0]?.image ?? ""}")`,
                }}
                onClick={() => onOpen(generation)}
                aria-label={
                  copy.library.open +
                  " — " +
                  relativeDay(copy, generation.createdAt)
                }
              >
                <span className="absolute left-2 top-2 rounded-full bg-black/40 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                  {relativeDay(copy, generation.createdAt)}
                </span>
                {generation.pending && (
                  <span className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 text-xs text-white">
                    <Loader2 size={14} className="animate-spin" />
                    {copy.library.saving}
                  </span>
                )}
              </button>
              <div className="library-card-meta flex shrink-0 items-center gap-1 py-2 pl-3 pr-1">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">
                    {copy.library.momentsCount.replace(
                      "{count}",
                      String(generation.highlights.length),
                    )}
                  </p>
                  <p className="mt-1 text-[10px] text-muted">
                    {left === 0
                      ? copy.library.expiresToday
                      : copy.library.expiresIn.replace("{days}", String(left))}
                  </p>
                </div>
                <button
                  className="grid h-11 w-11 shrink-0 place-items-center text-muted"
                  disabled={generation.pending}
                  onClick={() => setConfirming(generation)}
                  aria-label={
                    copy.library.delete +
                    " — " +
                    relativeDay(copy, generation.createdAt)
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          );
        })}
      </motion.ul>
      <div className="flex shrink-0 items-center justify-between border-t border-[var(--line)] pt-2">
        <span className="text-xs text-muted" aria-live="polite">
          {copy.studio.page} {current + 1} / {pages}
        </span>
        <div className="flex gap-2">
          <button
            className="icon-button"
            disabled={current === 0}
            aria-label={copy.studio.previous}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="icon-button"
            disabled={current === pages - 1}
            aria-label={copy.studio.next}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <p className="text-[11px] leading-4 text-muted">
        {copy.library.description}
      </p>
      {confirming && (
        <Sheet
          title={copy.library.deleteConfirm}
          closeLabel={copy.auth.profile.close}
          onClose={() => setConfirming(null)}
        >
          <div className="grid grid-cols-2 gap-3">
            <button
              className="secondary-button"
              onClick={() => setConfirming(null)}
            >
              {copy.account.deleteCancel}
            </button>
            <button
              className="primary-button !bg-[#b64d37] !text-white"
              onClick={() => {
                onDelete(confirming);
                setConfirming(null);
              }}
            >
              {copy.library.delete}
            </button>
          </div>
        </Sheet>
      )}
    </Screen>
  );
}
