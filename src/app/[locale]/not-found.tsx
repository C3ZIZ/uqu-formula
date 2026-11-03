// The not-found screen, shown in Arabic and English since it has no URL language to rely on.
import Link from "next/link";
import { Slashes } from "@/components/Slashes";
import { DEFAULT_LOCALE } from "@/config/locales";
import { getMessages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";

/** Explains the page does not exist and offers a way back. */
export default function NotFound() {
  const text = getMessages(DEFAULT_LOCALE).notFound;
  return (
    <main className="page">
      <div className="band claim">
        <Slashes />
        <div className="content claim-inner">
          <h1>{text.title}</h1>
          <p className="lead">{text.lead}</p>
          <Link className="button button--accent" href={localePath(DEFAULT_LOCALE, PAGE_ROUTES.home)}>
            {text.back}
          </Link>
        </div>
      </div>
    </main>
  );
}
