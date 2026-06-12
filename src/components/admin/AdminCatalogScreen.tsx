"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { adminService, type AdminIndustry, type AdminSpecialization, type AdminLanguage } from "@/services";
import { useI18n } from "@/i18n/I18nProvider";
import { useToast } from "@/lib/ToastProvider";
import { requestErrorToast } from "@/lib/errorToast";
import { cn } from "@/lib/cn";

type Tab = "industries" | "specializations" | "languages";

export function AdminCatalogScreen() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("industries");

  const tabs: { key: Tab; label: string }[] = [
    { key: "industries", label: t("admin.catalog.tabIndustries") },
    { key: "specializations", label: t("admin.catalog.tabSpecializations") },
    { key: "languages", label: t("admin.catalog.tabLanguages") },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.5px] text-ink">{t("admin.navCatalog")}</h1>
        <p className="mt-1 text-[13px] text-ink-3">{t("admin.catalog.subtitle")}</p>
      </div>

      <div className="flex gap-1 rounded-tile bg-muted p-1 self-start">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={cn(
              "rounded-[8px] px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              tab === tb.key ? "bg-surface text-ink shadow-sm" : "text-ink-3 hover:text-ink",
            )}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "industries" && (
        <CrudPanel<AdminIndustry>
          queryKey="adminIndustries"
          api={adminService.industries}
          codeKey="code"
          blank={{ code: "", name: "", position: 0 }}
          fields={[
            { key: "code", label: t("admin.catalog.fieldCode"), type: "text", readonlyOnEdit: true },
            { key: "name", label: t("admin.catalog.fieldName"), type: "text" },
            { key: "position", label: t("admin.catalog.fieldPosition"), type: "number" },
          ]}
        />
      )}
      {tab === "specializations" && (
        <CrudPanel<AdminSpecialization>
          queryKey="adminSpecializations"
          api={adminService.specializations}
          codeKey="code"
          blank={{ code: "", industryCode: "", name: "", popular: false, availableNow: 0 }}
          fields={[
            { key: "code", label: t("admin.catalog.fieldCode"), type: "text", readonlyOnEdit: true },
            { key: "industryCode", label: t("admin.catalog.fieldIndustry"), type: "text" },
            { key: "name", label: t("admin.catalog.fieldName"), type: "text" },
            { key: "popular", label: t("admin.catalog.fieldPopular"), type: "bool" },
            { key: "availableNow", label: t("admin.catalog.fieldAvailable"), type: "number" },
          ]}
        />
      )}
      {tab === "languages" && (
        <CrudPanel<AdminLanguage>
          queryKey="adminLanguages"
          api={adminService.languages}
          codeKey="code"
          blank={{ code: "", name: "", position: 0 }}
          fields={[
            { key: "code", label: t("admin.catalog.fieldCode"), type: "text", readonlyOnEdit: true },
            { key: "name", label: t("admin.catalog.fieldName"), type: "text" },
            { key: "position", label: t("admin.catalog.fieldPosition"), type: "number" },
          ]}
        />
      )}
    </div>
  );
}

type FieldType = "text" | "number" | "bool";
type FieldDef<T> = { key: keyof T & string; label: string; type: FieldType; readonlyOnEdit?: boolean };
type CrudApi<T> = {
  list: () => Promise<T[]>;
  create: (d: T) => Promise<T>;
  update: (code: string, d: T) => Promise<T>;
  remove: (code: string) => Promise<void>;
};

/** Generic dictionary editor: a table + an add/edit dialog driven by a field config. */
function CrudPanel<T extends Record<string, unknown>>({
  queryKey,
  api,
  fields,
  codeKey,
  blank,
}: {
  queryKey: string;
  api: CrudApi<T>;
  fields: FieldDef<T>[];
  codeKey: keyof T & string;
  blank: T;
}) {
  const { t } = useI18n();
  const { show } = useToast();
  const qc = useQueryClient();
  const onErr = (e: unknown) => show(requestErrorToast(e, t));

  const { data: rows = [], isLoading } = useQuery({ queryKey: [queryKey], queryFn: api.list });

  const [draft, setDraft] = useState<T | null>(null);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const input =
    "w-full rounded-tile border border-line-2 bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-ink";

  function setField(key: string, value: string | number | boolean) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }
  async function save() {
    if (!draft) return;
    setBusy(true);
    try {
      if (editingCode) await api.update(editingCode, draft);
      else await api.create(draft);
      await qc.invalidateQueries({ queryKey: [queryKey] });
      setDraft(null);
      setEditingCode(null);
    } catch (e) {
      onErr(e);
    } finally {
      setBusy(false);
    }
  }
  async function remove(row: T) {
    try {
      await api.remove(String(row[codeKey]));
      await qc.invalidateQueries({ queryKey: [queryKey] });
    } catch (e) {
      onErr(e);
    }
  }

  const codeEmpty = !draft || !String(draft[codeKey] ?? "").trim();

  return (
    <section className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button
          variant="dark"
          onClick={() => {
            setDraft({ ...blank });
            setEditingCode(null);
          }}
          className="rounded-tile px-4 py-2 text-[13px]"
        >
          <Plus className="h-4 w-4" />
          {t("admin.catalog.add")}
        </Button>
      </div>

      {isLoading ? (
        <div className="skeleton h-40 rounded-panel" />
      ) : rows.length === 0 ? (
        <div className="grid min-h-[120px] place-items-center rounded-panel border border-dashed border-line-2 text-sm text-ink-3">
          {t("admin.catalog.empty")}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-panel border border-line-3 bg-surface">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-[0.5px] text-ink-4">
                {fields.map((f) => (
                  <th key={f.key} className="px-3 py-2.5 font-semibold">
                    {f.label}
                  </th>
                ))}
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row[codeKey])} className="border-b border-line last:border-0">
                  {fields.map((f) => (
                    <td key={f.key} className="px-3 py-2.5 text-ink-2">
                      {f.type === "bool" ? (
                        Boolean(row[f.key]) ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <span className="text-ink-4">—</span>
                        )
                      ) : (
                        String(row[f.key] ?? "")
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setDraft({ ...row });
                          setEditingCode(String(row[codeKey]));
                        }}
                        aria-label={t("admin.catalog.edit")}
                        className="grid h-8 w-8 place-items-center rounded-tile text-ink-3 hover:bg-muted hover:text-ink"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(row)}
                        aria-label={t("admin.catalog.delete")}
                        className="grid h-8 w-8 place-items-center rounded-tile text-ink-3 hover:bg-muted hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={!!draft}
        onClose={() => {
          setDraft(null);
          setEditingCode(null);
        }}
        title={editingCode ? t("admin.catalog.edit") : t("admin.catalog.add")}
      >
        {draft && (
          <div className="flex flex-col gap-3">
            {fields.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1 block text-[12px] font-semibold text-ink-3">{f.label}</span>
                {f.type === "bool" ? (
                  <input
                    type="checkbox"
                    checked={Boolean(draft[f.key])}
                    onChange={(e) => setField(f.key, e.target.checked)}
                    className="h-4 w-4 accent-ink"
                  />
                ) : (
                  <input
                    type={f.type === "number" ? "number" : "text"}
                    value={f.type === "number" ? Number(draft[f.key] ?? 0) : String(draft[f.key] ?? "")}
                    disabled={!!editingCode && f.readonlyOnEdit}
                    onChange={(e) =>
                      setField(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)
                    }
                    className={cn(input, !!editingCode && f.readonlyOnEdit && "opacity-50")}
                  />
                )}
              </label>
            ))}
            <div className="mt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDraft(null);
                  setEditingCode(null);
                }}
                className="rounded-tile px-4 py-2.5 text-sm"
              >
                {t("admin.catalog.cancel")}
              </Button>
              <Button
                variant="dark"
                onClick={save}
                disabled={busy || codeEmpty}
                className="rounded-tile px-4 py-2.5 text-sm disabled:opacity-40"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("admin.catalog.save")}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </section>
  );
}
