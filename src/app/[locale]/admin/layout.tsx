// The admin area: blocks non-admins and adds the section tabs.
import type { ReactNode } from "react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { getMessages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { ADMIN_ROLES, requireRole } from "@/lib/auth";
import { pageLocale, type LocaleProps } from "@/lib/page";

/** Checks the admin role on every admin page. */
export default async function AdminLayout({ children, params }: LocaleProps & { children: ReactNode }) {
  const locale = await pageLocale(params);
  await requireRole(locale, localePath(locale, PAGE_ROUTES.admin), ADMIN_ROLES);
  const text = getMessages(locale);
  return (
    <>
      <AdminTabs locale={locale} text={text.admin.sections} label={text.admin.title} />
      {children}
    </>
  );
}
