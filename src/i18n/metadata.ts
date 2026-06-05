import type { Metadata } from "next";
import { getI18n } from "./server";

/** Build localized page metadata from dictionary keys. Title is fed through the
 *  root layout's "%s · skill.com" template automatically. */
export async function pageMetadata(titleKey: string, descKey?: string): Promise<Metadata> {
  const { t } = await getI18n();
  const title = t(titleKey);
  const description = descKey ? t(descKey) : undefined;
  return {
    title,
    ...(description ? { description } : {}),
    openGraph: { title, ...(description ? { description } : {}) },
  };
}
