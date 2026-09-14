import { notFound } from "next/navigation";
import { DesignGallery } from "./preview";

/** Local-only component gallery. No preview session or fixture is exposed in production. */
export default function DesignPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DesignGallery />;
}
