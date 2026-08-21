"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LogOut, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../../hooks/use-auth";
import { signOutUser } from "../../../lib/firebase/auth";
import type { AppCopy } from "../../../lib/mevid/copy";
import { tapHaptic } from "../../../lib/mevid/haptics";
import { ProfileModal } from "./profile-modal";

export function AccountMenu({ copy }: { copy: AppCopy }) {
  const { status, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => setImgFailed(false), [user?.photoUrl]);

  if (status !== "signed-in" || !user) return null;

  const initial = (user.displayName || user.email || "?").charAt(0).toUpperCase();
  const showPhoto = Boolean(user.photoUrl) && !imgFailed;

  return (
    <div className="relative">
      <button
        onClick={() => {
          tapHaptic();
          setOpen((current) => !current);
        }}
        aria-label={copy.auth.account.signedInAs}
        className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-white bg-[#252334] text-xs font-bold text-white shadow-sm"
      >
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoUrl!} alt="" referrerPolicy="no-referrer" onError={() => setImgFailed(true)} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            className="liquid-glass-strong absolute right-0 top-11 z-40 w-56 rounded-2xl p-3"
          >
            <p className="truncate px-1 text-xs text-[#6d6b79]">{copy.auth.account.signedInAs}</p>
            <p className="mb-2 truncate px-1 text-sm font-semibold text-[#232331]">{user.displayName ?? user.email}</p>
            <button
              onClick={() => {
                setOpen(false);
                setProfileOpen(true);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-[#3c3946] hover:bg-[#f3f1fa]"
            >
              <UserRound size={15} />{copy.auth.account.profile}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                void signOutUser();
              }}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-[#e0507a] hover:bg-[#fff3f6]"
            >
              <LogOut size={15} />{copy.auth.account.signOut}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>{profileOpen ? <ProfileModal copy={copy} onClose={() => setProfileOpen(false)} /> : null}</AnimatePresence>
    </div>
  );
}
