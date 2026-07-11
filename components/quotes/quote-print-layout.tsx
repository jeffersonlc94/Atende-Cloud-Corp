"use client";

import { QuotePrintLayoutClassico } from "@/components/quotes/quote-print-layout-classico";
import { QuotePrintLayoutModerno } from "@/components/quotes/quote-print-layout-moderno";
import { QuotePrintLayoutMinimalista } from "@/components/quotes/quote-print-layout-minimalista";
import type {
  QuotePrintCompany,
  QuotePrintData,
  QuotePrintItem,
  QuotePrintLayoutId,
} from "@/lib/quote-print-types";

export type { QuotePrintCompany, QuotePrintData, QuotePrintItem, QuotePrintLayoutId };
export { quotePrintLayoutOptions } from "@/lib/quote-print-types";

export function QuotePrintLayout({
  company,
  quote,
  id = "quote-print-area",
  layout = "classico",
}: {
  company: QuotePrintCompany | null | undefined;
  quote: QuotePrintData;
  id?: string;
  layout?: QuotePrintLayoutId;
}) {
  if (layout === "moderno") {
    return <QuotePrintLayoutModerno company={company} quote={quote} id={id} />;
  }
  if (layout === "minimalista") {
    return <QuotePrintLayoutMinimalista company={company} quote={quote} id={id} />;
  }
  return <QuotePrintLayoutClassico company={company} quote={quote} id={id} />;
}
