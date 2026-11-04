// The admin screen for coin QR codes.
"use client";

import type { Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { API_ROUTES, localePath, PAGE_ROUTES } from "@/config/routes";
import { sendJson } from "@/lib/client-api";
import { pickLocalized } from "@/lib/localized";
import { Printer } from "lucide-react";
import Link from "next/link";
import { ResourceManager, type FieldSpec } from "./ResourceManager";

export interface CoinCodeRow {
  id: string;
  token: string;
  labelAr: string;
  labelEn: string;
  coins: number;
  isActive: boolean;
  claimCount: number;
}

interface CoinCodesManagerProps {
  locale: Locale;
  items: CoinCodeRow[];
  unit: string;
  text: Messages["admin"];
  errors: Messages["errors"];
  fieldErrors: Messages["fieldErrors"];
}

/** Sets up the shared manager with coin code fields and print actions. */
export function CoinCodesManager({ locale, items, unit, text, errors, fieldErrors }: CoinCodesManagerProps) {
  const copy = text.coinCodes;
  const fields: FieldSpec[] = [
    { name: "labelAr", label: text.form.labelAr, kind: "text" },
    { name: "labelEn", label: text.form.labelEn, kind: "text" },
    { name: "coins", label: text.form.coins, kind: "number", latin: true },
  ];

  /** Switches a code on or off, keeping its other values. */
  async function toggle(code: CoinCodeRow, refresh: () => void) {
    const { labelAr, labelEn, coins, isActive } = code;
    const result = await sendJson(API_ROUTES.adminCoinCode(code.id), "PUT", { labelAr, labelEn, coins, isActive: !isActive });
    if (result.ok) refresh();
  }

  return (
    <ResourceManager
      locale={locale}
      items={items}
      fields={fields}
      emptyValues={{ labelAr: "", labelEn: "", coins: "", isActive: true }}
      createUrl={API_ROUTES.adminCoinCodes}
      itemUrl={API_ROUTES.adminCoinCode}
      toValues={(code) => ({ labelAr: code.labelAr, labelEn: code.labelEn, coins: code.coins, isActive: code.isActive })}
      renderItem={(code) => (
        <div className="resource-item">
          <div className="row-main">
            <b>{pickLocalized(locale, code.labelAr, code.labelEn)}</b>
            <span className="coin-gain"><b className="numeric">{code.coins}</b> {unit}</span>
          </div>
          <p className="lead">
            <span className="numeric code-token">{code.token}</span>
            {" · "}
            {code.isActive ? copy.activeNow : copy.inactive}
            {" · "}
            {copy.claimsCount}: <span className="numeric">{code.claimCount}</span>
          </p>
        </div>
      )}
      renderActions={(code, refresh) => (
        <>
          <Link className="text-action" href={localePath(locale, PAGE_ROUTES.adminCoinCodePrint(code.id))}>
            <Printer size={16} aria-hidden="true" />
            {copy.print}
          </Link>
          <a className="text-action" href={API_ROUTES.adminCoinCodeQr(code.id)} download>{copy.download}</a>
          <button type="button" className="text-action" onClick={() => toggle(code, refresh)}>
            {code.isActive ? copy.deactivate : copy.activate}
          </button>
        </>
      )}
      text={text}
      errors={errors}
      fieldErrors={fieldErrors}
    />
  );
}
