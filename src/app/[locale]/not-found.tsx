// The not-found page: an animated car off the track, with a way back.
import { NotFoundText } from "@/components/NotFoundText";
import { OffTrackScene } from "@/components/OffTrackScene";
import { getMessages } from "@/config/messages";

/** Shows the scene and hands both languages to the wording, which reads the address in the browser. */
export default function NotFound() {
  return (
    <main className="page off-track">
      <OffTrackScene />
      <NotFoundText copies={{ ar: getMessages("ar").notFound, en: getMessages("en").notFound }} />
    </main>
  );
}
