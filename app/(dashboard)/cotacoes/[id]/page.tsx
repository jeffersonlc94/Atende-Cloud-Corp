"use client";
import { use } from "react";
import { Loader2 } from "lucide-react";
import { useSupplierQuotation } from "@/hooks/use-supplier-quotations";
import { SupplierQuotationForm } from "@/components/supplier-quotations/supplier-quotation-form";
export default function EditSupplierQuotationPage({ params }: { params: Promise<{ id: string }> }) { const { id } = use(params); const { data, isLoading } = useSupplierQuotation(id); if (isLoading) return <div className="flex min-h-96 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>; return data ? <SupplierQuotationForm record={data} /> : <p className="p-6">Cotação não encontrada.</p>; }
