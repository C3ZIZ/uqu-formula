// Catches unknown addresses inside a language so they get the styled not-found screen.
import { notFound } from "next/navigation";

/** Shows the not-found screen. */
export default function CatchAllPage() {
  notFound();
}
