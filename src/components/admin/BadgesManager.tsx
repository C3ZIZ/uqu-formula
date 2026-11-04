// The admin screen for badges: challenge badges with a QR code, and the one all-days badge.
"use client";

import { BadgeMedal } from "@/components/BadgeMedal";
import { BADGE_ICONS, BADGE_KINDS, BADGE_KINDS_BY_NAME, type BadgeKind } from "@/config/literals";
import type { Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { API_ROUTES, localePath, PAGE_ROUTES } from "@/config/routes";
import { sendJson } from "@/lib/client-api";
import { pickLocalized } from "@/lib/localized";
import { Printer } from "lucide-react";
import Link from "next/link";
import { BadgeImagePicker } from "./BadgeImagePicker";
import { ResourceManager, type FieldSpec, type FormValues } from "./ResourceManager";

export interface BadgeRow {
  id: string;
  kind: BadgeKind;
  token: string | null;
  nameAr: string;
  nameEn: string;
  challengeAr: string;
  challengeEn: string;
  icon: string;
  imageUpdatedAt: Date | null;
  isActive: boolean;
  earnedCount: number;
}

interface BadgesManagerProps {
  locale: Locale;
  items: BadgeRow[];
  text: Messages["admin"];
  errors: Messages["errors"];
  fieldErrors: Messages["fieldErrors"];
}

/** Sets up the shared manager with badge fields, the picture choices, and print actions. */
export function BadgesManager({ locale, items, text, errors, fieldErrors }: BadgesManagerProps) {
  const copy = text.badges;
  const shared = text.coinCodes;
  const fields: FieldSpec[] = [
    { name: "nameAr", label: text.form.nameAr, kind: "text" },
    { name: "nameEn", label: text.form.nameEn, kind: "text" },
    { name: "challengeAr", label: copy.challengeAr, kind: "textarea" },
    { name: "challengeEn", label: copy.challengeEn, kind: "textarea" },
  ];
  const kindField: FieldSpec = {
    name: "kind",
    label: copy.kindLabel,
    kind: "select",
    options: BADGE_KINDS.map((kind) => ({ value: kind, label: copy.kinds[kind] })),
  };

  /** Switches a badge on or off and reports a failure. */
  async function toggle(badge: BadgeRow, refresh: () => void, reportError: (code: string) => void) {
    const result = await sendJson(API_ROUTES.adminBadge(badge.id), "PATCH", { isActive: !badge.isActive });
    if (result.ok) refresh();
    else reportError(result.error);
  }

  /** Leaves out the preview, which only this screen needs. */
  function toBody({ previewUrl, ...values }: FormValues): FormValues {
    void previewUrl;
    return values;
  }

  return (
    <ResourceManager
      locale={locale}
      items={items}
      fields={[kindField, ...fields]}
      editFields={fields}
      toBody={toBody}
      emptyValues={{
        kind: BADGE_KINDS_BY_NAME.challenge,
        nameAr: "",
        nameEn: "",
        challengeAr: "",
        challengeEn: "",
        icon: BADGE_ICONS[0],
        isActive: true,
      }}
      createUrl={API_ROUTES.adminBadges}
      itemUrl={API_ROUTES.adminBadge}
      toValues={(badge) => ({
        nameAr: badge.nameAr,
        nameEn: badge.nameEn,
        challengeAr: badge.challengeAr,
        challengeEn: badge.challengeEn,
        icon: badge.icon,
        isActive: badge.isActive,
        previewUrl: badge.imageUpdatedAt ? API_ROUTES.badgeImage(badge.id, new Date(badge.imageUpdatedAt).getTime()) : null,
      })}
      renderItem={(badge) => (
        <div className="resource-item badge-row">
          <BadgeMedal id={badge.id} icon={badge.icon} imageUpdatedAt={badge.imageUpdatedAt} earned={badge.isActive} />
          <div>
            <b>{pickLocalized(locale, badge.nameAr, badge.nameEn)}</b>
            <p className="lead">
              {copy.kinds[badge.kind]}
              {" · "}
              {badge.isActive ? shared.activeNow : shared.inactive}
              {" · "}
              {copy.earnedCount}: <span className="numeric">{badge.earnedCount}</span>
            </p>
            {badge.token ? <p className="lead"><span className="numeric code-token">{badge.token}</span></p> : null}
          </div>
        </div>
      )}
      renderActions={(badge, refresh, reportError) => (
        <>
          {badge.token ? (
            <>
              <Link className="text-action" href={localePath(locale, PAGE_ROUTES.adminBadgePrint(badge.id))}>
                <Printer size={16} aria-hidden="true" />
                {shared.print}
              </Link>
              <a className="text-action" href={API_ROUTES.adminBadgeQr(badge.id)} download>{shared.download}</a>
            </>
          ) : null}
          <button type="button" className="text-action" onClick={() => toggle(badge, refresh, reportError)}>
            {badge.isActive ? shared.deactivate : shared.activate}
          </button>
        </>
      )}
      renderFormExtra={(values, setValues) => <BadgeImagePicker values={values} setValues={setValues} text={copy} />}
      text={text}
      errors={errors}
      fieldErrors={fieldErrors}
    />
  );
}
