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
  const itemsPerPage = (fontScale ?? 1) >= 1.2 ? 10 : (fontScale ?? 1) >= 1.1 ? 12 : 14;
  const pages = quote.itens.length
    ? Array.from({ length: Math.ceil(quote.itens.length / itemsPerPage) }, (_, index) =>
        quote.itens.slice(index * itemsPerPage, (index + 1) * itemsPerPage)
      )
    : [[]];

  return (
    <div id={id} className="space-y-8 print:space-y-0">
      {pages.map((itens, pageIndex) => {
        const props = {
          company,
          quote: { ...quote, itens },
          fontFamily,
          fontScale,
          showFooter: pageIndex === pages.length - 1,
          itemOffset: pageIndex * itemsPerPage,
        };
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
