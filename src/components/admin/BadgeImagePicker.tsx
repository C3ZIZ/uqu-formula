// Lets an admin choose a ready icon, and optionally upload a picture that replaces it.
"use client";

import { BADGE_ICON_GLYPHS } from "@/components/BadgeMedal";
import { BADGE_ICONS, type BadgeIcon } from "@/config/literals";
import type { Messages } from "@/config/messages";
import { shrinkImage } from "@/lib/shrink-image";
import { ImagePlus } from "lucide-react";
import Image from "next/image";
import { useState, type ChangeEvent } from "react";
import type { FormValues } from "./ResourceManager";

interface BadgeImagePickerProps {
  values: FormValues;
  setValues: (changes: FormValues) => void;
  text: Messages["admin"]["badges"];
}

const PREVIEW_SIZE = 96;

/** Shows the icon choices, then the upload control with its preview. */
export function BadgeImagePicker({ values, setValues, text }: BadgeImagePickerProps) {
  const [failed, setFailed] = useState(false);
  const previewUrl = typeof values.previewUrl === "string" ? values.previewUrl : "";

  /** Shrinks the chosen file and keeps it ready for saving. */
  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const shrunk = await shrinkImage(file);
    setFailed(!shrunk);
    if (shrunk) setValues({ image: shrunk.base64, previewUrl: shrunk.previewUrl });
  }

  return (
    <>
      <fieldset className="icon-picker">
        <legend className="field-label">{text.iconLabel}</legend>
        <div className="icon-picker-grid">
          {BADGE_ICONS.map((icon: BadgeIcon) => {
            const Glyph = BADGE_ICON_GLYPHS[icon];
            return (
              <label key={icon} className="icon-choice">
                <input
                  type="radio"
                  name="icon"
                  value={icon}
                  aria-label={text.icons[icon]}
                  checked={values.icon === icon}
                  onChange={() => setValues({ icon })}
                />
                <Glyph size={24} strokeWidth={1.75} aria-hidden="true" />
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="badge-image-field">
        <p className="field-label">{text.imageLabel}</p>
        {previewUrl ? (
          <Image className="badge-image-preview" src={previewUrl} alt="" width={PREVIEW_SIZE} height={PREVIEW_SIZE} unoptimized />
        ) : null}
        <div className="actions">
          <label className="text-action badge-image-pick">
            <ImagePlus size={18} aria-hidden="true" />
            {text.imagePick}
            <input className="sr-only" type="file" accept="image/*" onChange={pick} />
          </label>
          {previewUrl ? (
            <button type="button" className="text-action" onClick={() => setValues({ image: null, previewUrl: null })}>
              {text.imageRemove}
            </button>
          ) : null}
        </div>
        <p className="lead">{text.imageHint}</p>
        {failed ? <p className="field-error" role="alert">{text.imageFailed}</p> : null}
      </div>
    </>
  );
}
