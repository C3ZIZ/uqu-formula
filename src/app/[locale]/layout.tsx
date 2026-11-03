// The root layout: language direction, fonts, top bar, and bottom navigation.
import { IBM_Plex_Sans_Arabic, Michroma, Noto_Kufi_Arabic } from "next/font/google";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { LOCALE_DIRECTION } from "@/config/locales";
import { getMessages } from "@/config/messages";
import { pageLocale, type LocaleProps } from "@/lib/page";
import "@/styles/tokens.css";
import "@/styles/base.css";
import "@/styles/components.css";
import "@/styles/screens.css";

const bodyFont = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
  display: "swap",
});
const kufiFont = Noto_Kufi_Arabic({ subsets: ["arabic"], weight: ["700"], variable: "--font-kufi", display: "swap" });
const wideFont = Michroma({ subsets: ["latin"], weight: "400", variable: "--font-wide", display: "swap" });

export const viewport: Viewport = { themeColor: "#0c272c", viewportFit: "cover", width: "device-width", initialScale: 1 };

/** Sets the page title and description for the current language. */
export async function generateMetadata({ params }: LocaleProps): Promise<Metadata> {
  const text = getMessages(await pageLocale(params));
  return {
    title: { default: text.brand.name, template: `%s · ${text.brand.name}` },
    description: text.meta.description,
  };
}

/** Wraps every page with the document shell and navigation. */
export default async function LocaleLayout({ children, params }: LocaleProps & { children: ReactNode }) {
  const locale = await pageLocale(params);
  const text = getMessages(locale);
  return (
    <html
      lang={locale}
      dir={LOCALE_DIRECTION[locale]}
      className={`${bodyFont.variable} ${kufiFont.variable} ${wideFont.variable}`}
    >
      <body>
        <TopBar locale={locale} />
        {children}
        <BottomNav locale={locale} text={text.nav} />
      </body>
    </html>
  );
}
