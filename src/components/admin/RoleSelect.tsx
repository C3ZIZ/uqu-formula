// Lets an admin change a person's role from the registrant list.
"use client";

import { ROLE_LIST, type Role } from "@/config/literals";
import type { Messages } from "@/config/messages";
import { API_ROUTES } from "@/config/routes";
import { sendJson } from "@/lib/client-api";
import { useState, type ChangeEvent } from "react";

interface RoleSelectProps {
  userId: string;
  role: Role;
  label: string;
  roles: Messages["admin"]["registrants"]["roles"];
  errors: Messages["errors"];
}

/** Saves the role right away and restores the old value if saving fails. */
export function RoleSelect({ userId, role, label, roles, errors }: RoleSelectProps) {
  const [value, setValue] = useState(role);
  const [error, setError] = useState<string>();

  /** Sends the new role to the server. */
  async function change(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as Role;
    const previous = value;
    setValue(next);
    setError(undefined);
    const result = await sendJson(API_ROUTES.adminUserRole(userId), "PUT", { role: next });
    if (!result.ok) {
      setValue(previous);
      setError((errors as Record<string, string>)[result.error] ?? errors.SERVER);
    }
  }

  return (
    <div className="field role-select">
      <select aria-label={label} value={value} onChange={change}>
        {ROLE_LIST.map((item) => (
          <option key={item} value={item}>{roles[item]}</option>
        ))}
      </select>
      {error ? <p className="field-error" role="alert">{error}</p> : null}
    </div>
  );
}
