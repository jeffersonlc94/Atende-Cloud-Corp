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

function paginateItems(items: QuotePrintItem[], pageCapacity: number) {
  if (items.length === 0) return [[]];

  const pages: QuotePrintItem[][] = [];
  let page: QuotePrintItem[] = [];
  let usedCapacity = 0;

  for (const item of items) {
    const descriptionLength = item.descricao.trim().length + (item.observacao?.trim().length ?? 0);
    const baseItemSize = item.fotoUrl
      ? 2
      : descriptionLength > 110
        ? 1.75
        : descriptionLength > 65
          ? 1.35
          : 1;
    const itemSize = baseItemSize + (item.observacao?.trim() ? 0.45 : 0);

    if (page.length > 0 && usedCapacity + itemSize > pageCapacity) {
      pages.push(page);
      page = [];
      usedCapacity = 0;
    }

    page.push(item);
    usedCapacity += itemSize;
  }

  if (page.length > 0) pages.push(page);
  return pages;
}

export function QuotePrintLayout({
  company,
  quote,
  id = "quote-print-area",
  layout = "classico",
  fontFamily,
  fontScale,
}: {
  company: QuotePrintCompany | null | undefined;
  quote: QuotePrintData;
  id?: string;
  layout?: QuotePrintLayoutId;
  fontFamily?: string;
  fontScale?: number;
}) {
  const baseCapacity = layout === "classico" ? 24 : layout === "minimalista" ? 20 : 14;
  const pageCapacity = (fontScale ?? 1) >= 1.2
    ? Math.floor(baseCapacity * 0.68)
    : (fontScale ?? 1) >= 1.1
      ? Math.floor(baseCapacity * 0.84)
      : baseCapacity;
  const pages = paginateItems(quote.itens, pageCapacity);
  let itemOffset = 0;

  return (
    <div id={id} className="space-y-8 print:space-y-0">
      {pages.map((itens, pageIndex) => {
        const props = {
          company,
          quote: { ...quote, itens },
          fontFamily,
          fontScale,
          showFooter: pageIndex === pages.length - 1,
          itemOffset,
        };
        itemOffset += itens.length;
        return (
          <div className="quote-print-page" key={pageIndex}>
            {layout === "moderno" ? <QuotePrintLayoutModerno {...props} /> :
             layout === "minimalista" ? <QuotePrintLayoutMinimalista {...props} /> :
             <QuotePrintLayoutClassico {...props} />}
          </div>
        );
      })}
    </div>
  );
}
