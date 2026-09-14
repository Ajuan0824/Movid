import { notFound } from "next/navigation";
import { DesignGallery } from "./preview";

/** Local-only component gallery. This route returns 404 in production. */
export default function DesignPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DesignGallery />;
}
