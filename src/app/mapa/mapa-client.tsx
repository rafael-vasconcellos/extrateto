"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Map } from "lucide-react";
import Link from "next/link";
import { ShareButtons } from "@/components/share-buttons";
import type { Member } from "@/data/mock-data";
import { getStatsByEstado } from "@/lib/aggregations";
import { BrazilMap } from "@/components/brazil-map";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { ESTADOS } from "@/lib/constants";
import { Footer } from "@/components/footer";

type MapMetric = "totalAcimaTeto" | "membrosAcimaTeto" | "percentualAcimaTeto";

const METRIC_OPTIONS: { value: MapMetric; label: string }[] = [
  { value: "totalAcimaTeto", label: "Total acima do teto (R$)" },
  { value: "membrosAcimaTeto", label: "Nº de membros acima do teto" },
  { value: "percentualAcimaTeto", label: "% acima do teto" },
];

interface MapaClientProps {
  members: Member[];
  availableYears: { value: string; label: string }[];
  currentYear: string;
}

export function MapaClient({ members, availableYears, currentYear }: MapaClientProps) {
  const router = useRouter();
  const [metric, setMetric] = useState<MapMetric>("totalAcimaTeto");

  const stateStats = useMemo(() => getStatsByEstado(members), [members]);

  const sortedStates = useMemo(() => {
    return Array.from(stateStats.values()).sort(
      (a, b) => b[metric] - a[metric]
    );
  }, [stateStats, metric]);

  const totals = useMemo(() => {
    const states = Array.from(stateStats.values());
    return {
      membros: states.reduce((s, st) => s + st.totalMembros, 0),
      totalAcimaTeto: states.reduce((s, st) => s + st.totalAcimaTeto, 0),
      membrosAcimaTeto: states.reduce((s, st) => s + st.membrosAcimaTeto, 0),
    };
  }, [stateStats]);

  function handleStateClick(estado: string) {
    router.push(`/?estado=${estado}`);
  }

  function handleYearChange(year: string) {
    router.push(`/mapa?ano=${year}`);
  }

  function formatMetricValue(value: number, m: MapMetric) {
    if (m === "totalAcimaTeto") return formatCurrency(value);
    if (m === "membrosAcimaTeto") return formatNumber(value);
    return formatPercent(value);
  }

  return (
    <div className="min-h-screen bg-background">
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao ranking
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Map className="h-6 w-6 text-red-primary" />
            <h1 className="font-serif text-2xl font-bold text-navy sm:text-3xl">
              Mapa de Calor por Estado
            </h1>
          </div>
          <ShareButtons title="ExtraTeto — Mapa de Calor por Estado" />
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMetric(opt.value)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  metric === opt.value
                    ? "bg-navy text-white"
                    : "bg-surface text-gray-600 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Ano:</span>
            <select
              value={currentYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-navy shadow-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
            >
              {availableYears.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex items-center justify-center rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <BrazilMap
              stateStats={stateStats}
              metric={metric}
              onStateClick={handleStateClick}
            />
          </div>

          <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="mb-1 font-serif text-lg font-bold text-navy">
              Ranking por Estado — {currentYear}
            </h2>
            <p className="mb-3 text-xs text-gray-500">
              Total: <span className="font-semibold text-red-primary">{formatCurrency(totals.totalAcimaTeto)}</span> acima do teto
              {" · "}{formatNumber(totals.membrosAcimaTeto)} membros
            </p>
            <div className="max-h-[460px] overflow-y-auto pr-2">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200 text-left text-[11px] uppercase tracking-wider text-gray-400">
                    <th className="pb-2 pr-2">#</th>
                    <th className="pb-2 pr-2">Estado</th>
                    <th className="pb-2 pr-2 text-right">Membros</th>
                    <th className="pb-2 pr-2 text-right">
                      {metric === "totalAcimaTeto" && "Total acima"}
                      {metric === "membrosAcimaTeto" && "Acima do teto"}
                      {metric === "percentualAcimaTeto" && "% acima"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStates.map((state, i) => {
                    const estadoInfo = ESTADOS.find(
                      (e) => e.sigla === state.estado
                    );
                    return (
                      <tr
                        key={state.estado}
                        onClick={() => handleStateClick(state.estado)}
                        className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-surface"
                      >
                        <td className="py-2 pr-2 text-xs text-gray-400">
                          {i + 1}
                        </td>
                        <td className="py-2 pr-2">
                          <span className="font-medium text-navy">
                            {state.estado}
                          </span>
                          {estadoInfo && (
                            <span className="ml-1 text-xs text-gray-400">
                              {estadoInfo.nome}
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-2 text-right text-xs text-gray-500">
                          {state.totalMembros}
                        </td>
                        <td className="py-2 pr-2 text-right text-xs font-semibold text-red-primary">
                          {formatMetricValue(state[metric], metric)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
