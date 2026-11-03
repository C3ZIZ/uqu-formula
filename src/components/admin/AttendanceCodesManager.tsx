// The admin screen for daily attendance QR codes.
"use client";

import type { Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { API_ROUTES, localePath, PAGE_ROUTES } from "@/config/routes";
import { sendJson } from "@/lib/client-api";
import { formatEventDate } from "@/lib/dates";
import { Printer } from "lucide-react";
import Link from "next/link";
import { ResourceManager, type FieldSpec } from "./ResourceManager";

export interface AttendanceCodeRow {
  id: string;
  token: string;
  eventDate: string;
  isActive: boolean;
  checkInCount: number;
}

interface AttendanceCodesManagerProps {
  locale: Locale;
  items: AttendanceCodeRow[];
  today: string;
  text: Messages["admin"];
  errors: Messages["errors"];
  fieldErrors: Messages["fieldErrors"];
}

/** Sets up the shared manager with a date field and print actions. */
export function AttendanceCodesManager({ locale, items, today, text, errors, fieldErrors }: AttendanceCodesManagerProps) {
  const copy = text.attendanceCodes;
  const shared = text.coinCodes;
  const fields: FieldSpec[] = [{ name: "eventDate", label: copy.date, kind: "date", latin: true }];

  /** Switches a code on or off. */
  async function toggle(code: AttendanceCodeRow, refresh: () => void) {
    const result = await sendJson(API_ROUTES.adminAttendanceCode(code.id), "PUT", { isActive: !code.isActive });
    if (result.ok) refresh();
  }

  return (
    <ResourceManager
      items={items}
      fields={fields}
      emptyValues={{ eventDate: today }}
      createUrl={API_ROUTES.adminAttendanceCodes}
      itemUrl={API_ROUTES.adminAttendanceCode}
      toValues={(code) => ({ eventDate: code.eventDate })}
      hideEdit
      renderItem={(code) => (
        <div className="resource-item">
          <div className="row-main">
            <b>{formatEventDate(code.eventDate, locale)}</b>
            <span className="coin-gain">
              {copy.checkIns}: <b className="numeric">{code.checkInCount}</b>
            </span>
          </div>
          <p className="lead">
            <span className="numeric">{code.eventDate}</span>
            {" · "}
            <span className="numeric code-token">{code.token}</span>
            {" · "}
            {code.isActive ? shared.activeNow : shared.inactive}
          </p>
        </div>
      )}
      renderActions={(code, refresh) => (
        <>
          <Link className="text-action" href={localePath(locale, PAGE_ROUTES.adminAttendanceCodePrint(code.id))}>
            <Printer size={16} aria-hidden="true" />
            {shared.print}
          </Link>
          <a className="text-action" href={API_ROUTES.adminAttendanceCodeQr(code.id)} download>{shared.download}</a>
          <button type="button" className="text-action" onClick={() => toggle(code, refresh)}>
            {code.isActive ? shared.deactivate : shared.activate}
          </button>
        </>
      )}
      text={text}
      errors={errors}
      fieldErrors={fieldErrors}
    />
  );
}
