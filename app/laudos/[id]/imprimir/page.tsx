"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileDown, Loader2, Pencil, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { TechnicalReportPrint, type TechnicalReportPrintData } from "@/components/technical-reports/technical-report-print";

export default function TechnicalReportPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const areaRef = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState<TechnicalReportPrintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  useEffect(() => { fetch(`/api/technical-reports/${id}`, { cache: "no-store" }).then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error); setReport(body); }).catch((error) => toast.error(error.message || "Erro ao carregar laudo")).finally(() => setLoading(false)); }, [id]);

  async function generatePdf() {
    if (!areaRef.current || !report) return;
    setGenerating(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
      const canvas = await html2canvas(areaRef.current, { scale: 3.125, useCORS: true, backgroundColor: "#ffffff", windowWidth: areaRef.current.scrollWidth, windowHeight: areaRef.current.scrollHeight });
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth(); const pageHeight = pdf.internal.pageSize.getHeight();
      const naturalHeight = canvas.height * pageWidth / canvas.width;
      const renderedHeight = Math.min(naturalHeight, pageHeight);
      const renderedWidth = canvas.width * renderedHeight / canvas.height;
      const offsetX = (pageWidth - renderedWidth) / 2;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", offsetX, 0, renderedWidth, renderedHeight, undefined, "FAST");
      pdf.save(`laudo-${report.numero}.pdf`);
    } catch { toast.error("Erro ao gerar PDF"); } finally { setGenerating(false); }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!report) return <p className="p-6">Laudo não encontrado.</p>;
  return <div className="min-h-screen bg-gray-200"><div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b bg-background p-4 print:hidden"><Link href="/laudos" className={buttonVariants({ variant: "ghost" })}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link><div className="flex gap-2"><Link href="/laudos" className={buttonVariants({ variant: "outline" })}><Pencil className="mr-2 h-4 w-4" /> Editar</Link><Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button><Button disabled={generating} onClick={generatePdf}>{generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}Gerar PDF</Button></div></div><div className="py-8 print:py-0"><div ref={areaRef}><TechnicalReportPrint report={report} /></div></div></div>;
}
