// The admin area: blocks non-admins and adds the section tabs.
import type { ReactNode } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { getMessages } from "@/config/messages";
import { requireAdmin } from "@/lib/auth";
import { pageLocale, type LocaleProps } from "@/lib/page";

/** Adds the tabs for admins. Each page also checks the role itself, because this check does not protect page data. */
export default async function AdminLayout({ children, params }: LocaleProps & { children: ReactNode }) {
  const locale = await pageLocale(params);
  await requireAdmin(locale);
  const text = getMessages(locale);
  return (
    <>
      <AdminTabs locale={locale} text={text.admin.sections} label={text.admin.title} />
      {children}
    </>
  );
}
