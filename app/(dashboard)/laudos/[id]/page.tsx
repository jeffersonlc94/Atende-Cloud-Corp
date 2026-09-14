"use client";

import { use } from "react";
import { TechnicalReportForm } from "@/components/technical-reports/technical-report-form";

export default function EditTechnicalReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TechnicalReportForm reportId={id} />;
}
