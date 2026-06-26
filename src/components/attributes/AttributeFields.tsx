"use client";

import { Info } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { Chip, fieldInput } from "@/components/onboarding/parts";
import type { AttributeGroupDef, AttributeDef, WorkerAttributeInput } from "@/lib/types";

/** In-progress value for one attribute (only the field matching its type is set). */
export type AttrVal = { options?: string[]; bool?: boolean; text?: string; date?: string; validUntil?: string };

/** Flatten per-attribute state into the backend's attribute-answer list. */
export function buildAttributePayload(
  groups: AttributeGroupDef[],
  values: Record<string, AttrVal>,
): WorkerAttributeInput[] {
  const out: WorkerAttributeInput[] = [];
  for (const g of groups) {
    for (const a of g.attributes) {
      const v = values[a.code];
      if (!v) continue;
      if (a.type === "SINGLE_SELECT") {
        const code = v.options?.[0];
        if (code) out.push({ attributeCode: a.code, optionCode: code });
      } else if (a.type === "MULTI_SELECT") {
        for (const code of v.options ?? []) out.push({ attributeCode: a.code, optionCode: code });
      } else if (a.type === "BOOL" || a.type === "BOOL_EXPIRY") {
        if (v.bool) out.push({ attributeCode: a.code, boolValue: true, validUntil: v.validUntil || null });
      } else if (a.type === "DATE") {
        if (v.date) out.push({ attributeCode: a.code, dateValue: v.date });
      } else if (a.type === "TEXT") {
        if (v.text?.trim()) out.push({ attributeCode: a.code, textValue: v.text.trim() });
      }
    }
  }
  return out;
}

/** Renders a catalog attribute schema (groups → attributes by type) with "(i)" help. Headless of any card. */
export function AttributeFields({
  groups,
  values,
  setValues,
}: {
  groups: AttributeGroupDef[];
  values: Record<string, AttrVal>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, AttrVal>>>;
}) {
  const patch = (code: string, p: AttrVal) => setValues((m) => ({ ...m, [code]: { ...m[code], ...p } }));
  return (
    <div className="flex flex-col gap-6">
      {groups.map((g) => (
        <section key={g.code}>
          <p className="mb-2 text-[12px] font-semibold text-ink-3">{g.label}</p>
          <div className="flex flex-col gap-4">
            {g.attributes.map((a) => (
              <AttributeField key={a.code} attr={a} value={values[a.code]} onPatch={(p) => patch(a.code, p)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function AttributeField({
  attr,
  value,
  onPatch,
}: {
  attr: AttributeDef;
  value?: AttrVal;
  onPatch: (p: AttrVal) => void;
}) {
  const { t } = useI18n();
  const selected = value?.options ?? [];

  const label = (
    <div className="mb-1.5">
      <span className="text-[13px] font-medium text-ink">{attr.label}</span>
      {attr.help && (
        <span className="mt-0.5 flex items-start gap-1.5 text-[11px] leading-snug text-ink-4">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          {attr.help}
        </span>
      )}
    </div>
  );

  if (attr.type === "SINGLE_SELECT" || attr.type === "MULTI_SELECT") {
    const multi = attr.type === "MULTI_SELECT";
    return (
      <div>
        {label}
        <div className="flex flex-wrap gap-2">
          {attr.options.map((o) => {
            const on = selected.includes(o.code);
            return (
              <Chip
                key={o.code}
                label={o.label}
                selected={on}
                check={multi}
                onClick={() =>
                  onPatch({
                    options: multi
                      ? on ? selected.filter((x) => x !== o.code) : [...selected, o.code]
                      : on ? [] : [o.code],
                  })
                }
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (attr.type === "BOOL" || attr.type === "BOOL_EXPIRY") {
    const on = value?.bool ?? false;
    return (
      <div>
        {/* Whole row is the checkbox: label + help on the left, checkbox on the right. */}
        <label className="flex cursor-pointer items-start justify-between gap-4">
          <span className="min-w-0">
            <span className="text-[13px] font-medium text-ink">{attr.label}</span>
            {attr.help && (
              <span className="mt-0.5 flex items-start gap-1.5 text-[11px] leading-snug text-ink-4">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                {attr.help}
              </span>
            )}
          </span>
          <input
            type="checkbox"
            checked={on}
            onChange={() => onPatch({ bool: !on })}
            className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-ink"
          />
        </label>
        {/* Expiry date appears below, only once checked. */}
        {attr.type === "BOOL_EXPIRY" && on && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[12px] text-ink-3">{t("onboarding.validUntil")}</span>
            <input
              type="date"
              value={value?.validUntil ?? ""}
              onChange={(e) => onPatch({ validUntil: e.target.value })}
              aria-label={t("onboarding.validUntil")}
              className="rounded-tile border border-line-2 bg-surface px-2.5 py-1.5 text-[12px] text-ink outline-none"
            />
          </div>
        )}
      </div>
    );
  }

  if (attr.type === "DATE") {
    return (
      <div>
        {label}
        <input
          type="date"
          value={value?.date ?? ""}
          onChange={(e) => onPatch({ date: e.target.value })}
          className="rounded-tile border border-line-2 bg-surface px-2.5 py-1.5 text-[12px] text-ink outline-none"
        />
      </div>
    );
  }

  return (
    <div>
      {label}
      <input value={value?.text ?? ""} onChange={(e) => onPatch({ text: e.target.value })} className={fieldInput} />
    </div>
  );
}
