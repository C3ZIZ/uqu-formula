// The shared list, add, edit, and delete screen used for agenda items, zones, and coin codes.
"use client";

import type { Messages } from "@/config/messages";
import { sendJson } from "@/lib/client-api";
import { CircleAlert, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent, type ReactNode } from "react";

export type FormValues = Record<string, string | number | boolean | null>;

export interface FieldSpec {
  name: string;
  label: string;
  kind: "text" | "textarea" | "number" | "time" | "date" | "select";
  options?: { value: string; label: string }[];
  latin?: boolean;
}

interface ResourceManagerProps<T extends { id: string }> {
  items: T[];
  fields: FieldSpec[];
  emptyValues: FormValues;
  createUrl: string;
  itemUrl: (id: string) => string;
  toValues: (item: T) => FormValues;
  renderItem: (item: T) => ReactNode;
  renderActions?: (item: T, refresh: () => void) => ReactNode;
  hideEdit?: boolean;
  renderFormExtra?: (values: FormValues, setValues: (changes: FormValues) => void) => ReactNode;
  text: Messages["admin"];
  errors: Messages["errors"];
  fieldErrors: Messages["fieldErrors"];
}

/** Draws one form input from its description. */
function FormField({ spec, value, invalid, invalidText, onChange }: {
  spec: FieldSpec;
  value: FormValues[string];
  invalid: boolean;
  invalidText: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  const shared = { id, name: spec.name, value: String(value ?? ""), "aria-invalid": invalid || undefined };
  return (
    <div className={spec.latin ? "field field--latin" : "field"}>
      <label htmlFor={id}>{spec.label}</label>
      {spec.kind === "select" ? (
        <select {...shared} onChange={(event) => onChange(event.target.value)}>
          {spec.options?.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : spec.kind === "textarea" ? (
        <textarea {...shared} rows={2} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input
          {...shared}
          type={spec.kind}
          inputMode={spec.kind === "number" ? "numeric" : undefined}
          step={spec.kind === "number" ? "any" : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {invalid ? (
        <p className="field-error" role="alert">
          <CircleAlert size={18} aria-hidden="true" />
          {invalidText}
        </p>
      ) : null}
    </div>
  );
}

/** Lists items and handles adding, editing, and two-step deleting. */
export function ResourceManager<T extends { id: string }>(props: ResourceManagerProps<T>) {
  const { items, fields, emptyValues, createUrl, itemUrl, toValues, renderItem, renderActions, renderFormExtra } = props;
  const { text, errors, fieldErrors, hideEdit } = props;
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [values, setValuesState] = useState<FormValues>(emptyValues);
  const [badFields, setBadFields] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<string>();

  /** Merges changed values into the form. */
  function setValues(changes: FormValues) {
    setValuesState((current) => ({ ...current, ...changes }));
  }

  /** Opens the form for a new item or an existing one. */
  function open(id: string, initial: FormValues) {
    setEditing(id);
    setValuesState(initial);
    setBadFields([]);
    setError(undefined);
  }

  /** Reloads the list from the server. */
  function refresh() {
    router.refresh();
  }

  /** Turns an API error code into readable text. */
  function errorText(code: string): string {
    return (errors as Record<string, string>)[code] ?? errors.SERVER;
  }

  /** Saves the form to the API. */
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    const isNew = editing === "new";
    const result = await sendJson(isNew ? createUrl : itemUrl(editing ?? ""), isNew ? "POST" : "PUT", values);
    setBusy(false);
    if (result.ok) {
      setEditing(null);
      refresh();
    } else {
      setBadFields(result.fields);
      setError(errorText(result.error));
    }
  }

  /** Deletes after a second press, avoiding a blocking browser dialog. */
  async function remove(id: string) {
    if (confirming !== id) {
      setConfirming(id);
      return;
    }
    setConfirming(undefined);
    const result = await sendJson(itemUrl(id), "DELETE");
    if (result.ok) refresh();
    else setError(errorText(result.error));
  }

  const form = (
    <form className="form resource-form" onSubmit={save}>
      {fields.map((spec) => (
        <FormField
          key={spec.name}
          spec={spec}
          value={values[spec.name]}
          invalid={badFields.includes(spec.name)}
          invalidText={fieldErrors.invalid}
          onChange={(value) => setValues({ [spec.name]: value })}
        />
      ))}
      {renderFormExtra?.(values, setValues)}
      {error ? (
        <p className="form-error" role="alert">
          <CircleAlert size={20} aria-hidden="true" />
          {error}
        </p>
      ) : null}
      <div className="actions">
        <button className="button" type="submit" disabled={busy}>{text.form.save}</button>
        <button className="text-action" type="button" onClick={() => setEditing(null)}>{text.form.cancel}</button>
      </div>
    </form>
  );

  return (
    <div className="content resource">
      {editing === "new" ? form : (
        <button type="button" className="button" onClick={() => open("new", emptyValues)}>
          <Plus size={20} aria-hidden="true" />
          {text.form.add}
        </button>
      )}
      {error && editing === null ? (
        <p className="form-error resource-error" role="alert">
          <CircleAlert size={20} aria-hidden="true" />
          {error}
        </p>
      ) : null}
      {items.length === 0 ? <p className="lead resource-empty">{text.empty}</p> : null}
      <ul className="rows resource-list">
        {items.map((item) => (
          <li key={item.id}>
            {editing === item.id ? form : (
              <>
                {renderItem(item)}
                <div className="actions resource-actions">
                  {hideEdit ? null : (
                    <button type="button" className="text-action" onClick={() => open(item.id, toValues(item))}>
                      {text.form.edit}
                    </button>
                  )}
                  {renderActions?.(item, refresh)}
                  <button type="button" className="text-action" onClick={() => remove(item.id)}>
                    {confirming === item.id ? text.form.confirmDelete : text.form.delete}
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
