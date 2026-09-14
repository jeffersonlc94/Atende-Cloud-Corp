"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { formatDateBR } from "@/lib/format";

/* eslint-disable @next/next/no-img-element */

export type TechnicalReportPrintData = {
  numero: string; dataEmissao: string | Date; clienteCodigo?: string | null; clienteNome: string; clienteFantasia?: string | null;
  clienteEndereco?: string | null; clienteNumero?: string | null; clienteBairro?: string | null; clienteCidade?: string | null;
  clienteUf?: string | null; clienteTelefone?: string | null; clienteDocumento?: string | null; equipamento: string;
  numeroSerie?: string | null; modelo?: string | null; equipamentoObservacao?: string | null; problema?: string | null;
  problemaRelatado?: string | null; problemasEncontrados?: string | null; procedimentosRealizados?: string | null; conclusao?: string | null;
  fotos?: string[] | null;
  createdByUser?: { name: string } | null;
  company: { razaoSocial: string; nomeFantasia?: string | null; cnpj?: string | null; inscricaoEstadual?: string | null; endereco?: string | null; cidade?: string | null; estado?: string | null; cep?: string | null; telefone1?: string | null; email?: string | null; logoUrl?: string | null; nomeResponsavel?: string | null };
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-2 break-inside-avoid rounded-lg border border-black"><h2 className="border-b border-black px-3 py-0.5 text-center text-[0.74em] font-bold uppercase">{title}</h2><div className="whitespace-pre-wrap break-words px-3 py-1.5 text-[0.7em] leading-snug [overflow-wrap:anywhere]">{children || "—"}</div></section>;
}

export function TechnicalReportPrint({ report, id = "technical-report-print", layout = "classico" }: { report: TechnicalReportPrintData; id?: string; layout?: "classico" | "fotos" }) {
  const [logoError, setLogoError] = useState(false);
  const company = report.company;
  const address = [company.endereco, company.cidade && company.estado ? `${company.cidade}/${company.estado}` : company.cidade].filter(Boolean).join(" - ");
  return <div id={id} className="mx-auto w-full max-w-[210mm] bg-white p-5 text-black print:p-4" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "15px" }}>
    <header className="rounded-xl border border-black p-2.5"><div className="flex items-center gap-3">{company.logoUrl && !logoError ? <img src={company.logoUrl} alt="Logo" className="h-16 w-48 shrink-0 object-contain" onError={() => setLogoError(true)} /> : <div className="flex h-16 w-24 shrink-0 items-center justify-center border border-black"><Building2 className="h-8 w-8" /></div>}<div className="min-w-0 flex-1 text-[0.68em] leading-tight"><h1 className="text-[1.2em] font-bold uppercase">{company.razaoSocial}</h1>{company.nomeFantasia && <p className="font-semibold">{company.nomeFantasia}</p>}<p>{company.cnpj && `CNPJ: ${company.cnpj}`}{company.inscricaoEstadual && ` · IE: ${company.inscricaoEstadual}`}</p>{address && <p>{address}</p>}<p><b>CEP:</b> {company.cep || "—"} <b className="ml-3">Fone celular:</b> {company.telefone1 || "—"}</p>{company.email && <p>{company.email}</p>}</div><div className="shrink-0 text-right text-[0.7em]"><p>NÚMERO: <b className="ml-3 text-[1.15em]">{report.numero}</b></p><p>Emissão: <b>{formatDateBR(report.dataEmissao)}</b></p></div></div></header>
    <h1 className="mt-2 rounded-lg border border-black py-1 text-center text-[1.15em] font-bold uppercase">Laudo Técnico</h1>
    <section className="mt-3 rounded-xl border border-black p-3 text-[0.72em]"><div className="grid grid-cols-2 gap-x-5 gap-y-1"><p><b>CLIENTE:</b> {[report.clienteCodigo, report.clienteNome].filter(Boolean).join(" ")}</p><p><b>FANTASIA:</b> {report.clienteFantasia || "—"}</p><p><b>ENDEREÇO:</b> {[report.clienteEndereco, report.clienteNumero].filter(Boolean).join(", ") || "—"}</p><p><b>BAIRRO:</b> {report.clienteBairro || "—"}</p><p><b>CIDADE:</b> {report.clienteCidade || "—"} {report.clienteUf && `- ${report.clienteUf}`}</p><p><b>TELEFONE:</b> {report.clienteTelefone || "—"} <b className="ml-3">CPF/CNPJ:</b> {report.clienteDocumento || "—"}</p></div></section>
    <section className="mt-3 rounded-xl border border-black text-[0.72em]"><h2 className="border-b border-black px-3 py-1 text-center font-bold uppercase">Dados do equipamento</h2><div className="grid grid-cols-2 gap-x-5 gap-y-2 p-3"><p><b>EQUIPAMENTO:</b> {report.equipamento}</p><p><b>NÚMERO DE SÉRIE:</b> {report.numeroSerie || "—"}</p><p><b>MODELO:</b> {report.modelo || "—"}</p><p><b>OBS.:</b> {report.equipamentoObservacao || "—"}</p><p className="col-span-2"><b>PROBLEMA:</b> {report.problema || "—"}</p></div></section>
    <Section title="Problema relatado">{report.problemaRelatado}</Section>
    <Section title="Problemas encontrados">{report.problemasEncontrados}</Section>
    <Section title="Procedimentos realizados">{report.procedimentosRealizados}</Section>
    <Section title="Conclusão do laudo">{report.conclusao}</Section>
    {layout === "fotos" && !!report.fotos?.length && <section data-technical-report-photos className="mt-3 break-before-page rounded-lg border border-black"><h2 className="border-b border-black px-3 py-1 text-center text-[0.78em] font-bold uppercase">Registro fotográfico</h2><div className="grid grid-cols-2 gap-3 p-3">{report.fotos.slice(0, 3).map((url, index) => <figure key={`${url}-${index}`} className={report.fotos?.length === 3 && index === 2 ? "col-span-2" : ""}><img src={url} alt={`Registro fotográfico ${index + 1}`} className="mx-auto h-[82mm] max-w-full object-contain" /><figcaption className="mt-1 text-center text-[0.68em] font-semibold">Foto {index + 1}</figcaption></figure>)}</div></section>}
    <footer className="break-inside-avoid pt-6 text-center text-[0.68em]"><div className="mx-auto w-72 border-t border-black pt-1"><p className="font-semibold uppercase">{report.createdByUser?.name || company.nomeResponsavel || "Responsável técnico"}</p><p>TÉCNICO</p><p className="font-bold italic">{company.cidade || "—"} - {company.estado || "—"}</p></div></footer>
  </div>;
}
