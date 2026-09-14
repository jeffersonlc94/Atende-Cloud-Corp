"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileDown, Loader2, Pencil, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { TechnicalReportPrint, type TechnicalReportPrintData } from "@/components/technical-reports/technical-report-print";

export default function TechnicalReportPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<TechnicalReportPrintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [layout, setLayout] = useState<"classico" | "fotos">("classico");
  useEffect(() => { fetch(`/api/technical-reports/${id}`, { cache: "no-store" }).then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error); setReport(body); }).catch((error) => toast.error(error.message || "Erro ao carregar laudo")).finally(() => setLoading(false)); }, [id]);

  async function generatePdf() {
    const reportElement = document.getElementById("technical-report-print");
    if (!reportElement || !report) return;
    setGenerating(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth(); const pageHeight = pdf.internal.pageSize.getHeight();
      if (layout === "classico") {
        const canvas = await html2canvas(reportElement, { scale: 3.125, useCORS: true, backgroundColor: "#ffffff", width: reportElement.scrollWidth, height: reportElement.scrollHeight, windowWidth: reportElement.scrollWidth, windowHeight: reportElement.scrollHeight });
        const naturalHeight = canvas.height * pageWidth / canvas.width;
        const renderedHeight = Math.min(naturalHeight, pageHeight); const renderedWidth = canvas.width * renderedHeight / canvas.height;
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", (pageWidth - renderedWidth) / 2, 0, renderedWidth, renderedHeight, undefined, "FAST");
      } else {
        const baseCanvas = await html2canvas(reportElement, { scale: 3.125, useCORS: true, backgroundColor: "#ffffff", onclone: (documentClone) => { const photos = documentClone.querySelector<HTMLElement>("[data-technical-report-photos]"); if (photos) photos.style.display = "none"; } });
        const baseHeight = Math.min(baseCanvas.height * pageWidth / baseCanvas.width, pageHeight); const baseWidth = baseCanvas.width * baseHeight / baseCanvas.height;
        pdf.addImage(baseCanvas.toDataURL("image/png"), "PNG", (pageWidth - baseWidth) / 2, 0, baseWidth, baseHeight, undefined, "FAST");
        const photosElement = reportElement.querySelector<HTMLElement>("[data-technical-report-photos]");
        if (photosElement) { const photoCanvas = await html2canvas(photosElement, { scale: 3.125, useCORS: true, backgroundColor: "#ffffff" }); const photoHeight = Math.min(photoCanvas.height * pageWidth / photoCanvas.width, pageHeight); const photoWidth = photoCanvas.width * photoHeight / photoCanvas.height; pdf.addPage(); pdf.addImage(photoCanvas.toDataURL("image/png"), "PNG", (pageWidth - photoWidth) / 2, 8, photoWidth, photoHeight, undefined, "FAST"); }
      }
      pdf.save(`laudo-${report.numero}.pdf`);
    } catch { toast.error("Erro ao gerar PDF"); } finally { setGenerating(false); }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!report) return <p className="p-6">Laudo não encontrado.</p>;
  return <div className="min-h-screen bg-gray-200"><div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b bg-background p-4 print:hidden"><Link href="/laudos" className={buttonVariants({ variant: "ghost" })}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link><div className="flex flex-wrap gap-2"><div className="flex rounded-md border bg-background p-0.5"><Button size="sm" variant={layout === "classico" ? "default" : "ghost"} onClick={() => setLayout("classico")}>Clássico</Button><Button size="sm" variant={layout === "fotos" ? "default" : "ghost"} onClick={() => setLayout("fotos")}>Com fotos ({report.fotos?.length || 0})</Button></div><Link href={`/laudos/${id}`} className={buttonVariants({ variant: "outline" })}><Pencil className="mr-2 h-4 w-4" /> Editar</Link><Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button><Button disabled={generating} onClick={generatePdf}>{generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}Gerar PDF</Button></div></div><div className="py-8 print:py-0"><TechnicalReportPrint report={report} layout={layout} /></div></div>;
}
