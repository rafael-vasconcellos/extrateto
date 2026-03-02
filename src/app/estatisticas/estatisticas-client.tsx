"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Users,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { ShareButtons } from "@/components/share-buttons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Member } from "@/data/mock-data";
import { getStatsByOrgao } from "@/lib/aggregations";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatCompactCurrency,
} from "@/lib/utils";
import { SalaryComparison } from "@/components/salary-comparison";
import { Footer } from "@/components/footer";

type OrgaoMetric =
  | "totalAcimaTeto"
  | "membrosAcimaTeto"
  | "percentualAcimaTeto";

const ORGAO_METRIC_OPTIONS: { value: OrgaoMetric; label: string }[] = [
  { value: "totalAcimaTeto", label: "Total acima do teto (R$)" },
  { value: "membrosAcimaTeto", label: "Membros" },
  { value: "percentualAcimaTeto", label: "% acima do teto" },
];

const COMPOSITION_COLORS = [
  {
    bg: "bg-blue-500",
    text: "text-blue-700",
    light: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    bg: "bg-red-500",
    text: "text-red-700",
    light: "bg-red-50",
    border: "border-red-200",
  },
  {
    bg: "bg-amber-500",
    text: "text-amber-700",
    light: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    bg: "bg-emerald-500",
    text: "text-emerald-700",
    light: "bg-emerald-50",
    border: "border-emerald-200",
  },
];

const INFRA_ITEMS = [
  {
    nome: "Hospitais",
    descricao: "de médio porte (200 leitos)",
    custo: 50_000_000,
    icon: Building2,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  {
    nome: "Creches",
    descricao: "para 120 crianças",
    custo: 3_500_000,
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    nome: "Escolas",
    descricao: "para 800 alunos",
    custo: 8_000_000,
    icon: BookOpen,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  {
    nome: "Universidades",
    descricao: "campus federal",
    custo: 150_000_000,
    icon: GraduationCap,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
];

interface EstatisticasClientProps {
  members: Member[];
  availableYears: { value: string; label: string }[];
  currentYear: string;
}

export function EstatisticasClient({
  members,
  availableYears,
  currentYear,
}: EstatisticasClientProps) {
  const router = useRouter();
  const [orgaoMetric, setOrgaoMetric] =
    useState<OrgaoMetric>("totalAcimaTeto");

  function handleYearChange(year: string) {
    router.push(`/estatisticas?ano=${year}`);
  }

  const orgaoStats = useMemo(() => {
    return Array.from(getStatsByOrgao(members).values());
  }, [members]);

  const top10Orgaos = useMemo(() => {
    return [...orgaoStats]
      .sort((a, b) => (b[orgaoMetric] as number) - (a[orgaoMetric] as number))
      .slice(0, 10)
      .map((o) => ({
        name: o.orgao,
        value: o[orgaoMetric] as number,
      }));
  }, [orgaoStats, orgaoMetric]);

  const composition = useMemo(() => {
    let base = 0,
      verbas = 0,
      eventuais = 0,
      pessoais = 0;
    for (const m of members) {
      base += m.remuneracaoBase;
      verbas += m.verbasIndenizatorias;
      eventuais += m.direitosEventuais;
      pessoais += m.direitosPessoais;
    }
    const total = base + verbas + eventuais + pessoais;
    return {
      items: [
        { name: "Remuneração Base", value: base },
        { name: "Verbas Indenizatórias", value: verbas },
        { name: "Direitos Eventuais", value: eventuais },
        { name: "Direitos Pessoais", value: pessoais },
      ],
      total,
      basePercent: total > 0 ? Math.round((base / total) * 100) : 0,
    };
  }, [members]);

  const medianRemun = useMemo(() => {
    const acima = members.filter((m) => m.acimaTeto > 0);
    if (acima.length === 0) return 0;
    const sorted = [...acima].sort(
      (a, b) => a.remuneracaoTotal - b.remuneracaoTotal
    );
    return sorted[Math.floor(sorted.length / 2)].remuneracaoTotal;
  }, [members]);

  const totalAcimaTeto = useMemo(() => {
    return members.reduce((acc, m) => acc + m.acimaTeto, 0);
  }, [members]);

  function formatOrgaoTooltip(value: number) {
    if (orgaoMetric === "totalAcimaTeto") return formatCurrency(value);
    if (orgaoMetric === "percentualAcimaTeto") return formatPercent(value);
    return formatNumber(value);
  }

  function formatOrgaoTick(v: number) {
    if (orgaoMetric === "totalAcimaTeto")
      return `${(v / 1_000_000).toFixed(0)}M`;
    if (orgaoMetric === "percentualAcimaTeto") return `${v.toFixed(0)}%`;
    return formatNumber(v);
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

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-red-primary" />
            <h1 className="font-serif text-2xl font-bold text-navy sm:text-3xl">
              Estatísticas Agregadas
            </h1>
          </div>
          <div className="flex items-center gap-3">
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
            <ShareButtons title="ExtraTeto — Estatísticas Agregadas" />
          </div>
        </div>

        {/* Section 1: Top 10 Orgaos */}
        <section className="mb-6 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-lg font-bold text-navy">
              Top 10 Órgãos ({currentYear})
            </h2>
            <div className="flex gap-1">
              {ORGAO_METRIC_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setOrgaoMetric(opt.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    orgaoMetric === opt.value
                      ? "bg-navy text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={top10Orgaos}
                layout="vertical"
                margin={{ left: 5, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  tickFormatter={formatOrgaoTick}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#94A3B8" }}
                  width={65}
                />
                <Tooltip
                  formatter={(v) => formatOrgaoTooltip(Number(v))}
                />
                <Bar
                  dataKey="value"
                  fill="#DC2626"
                  radius={[0, 4, 4, 0]}
                  name="Valor"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Section 2 & 3: Composicao + Salary Comparison */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          {/* Composição da Remuneração */}
          <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="mb-1 font-serif text-base font-bold text-navy">
              Composição da Remuneração
            </h2>
            <p className="mb-4 text-xs text-gray-500">
              De onde vem o dinheiro de quem recebe acima do teto
            </p>

            {/* Stacked horizontal bar */}
            <div className="mb-4 flex h-10 overflow-hidden rounded-lg">
              {composition.items.map((item, i) => {
                const pct =
                  composition.total > 0
                    ? (item.value / composition.total) * 100
                    : 0;
                if (pct < 1) return null;
                return (
                  <div
                    key={item.name}
                    className={`${COMPOSITION_COLORS[i].bg} flex items-center justify-center transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${item.name}: ${pct.toFixed(1)}%`}
                  >
                    {pct > 8 && (
                      <span className="text-[10px] font-bold text-white">
                        {pct.toFixed(0)}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Highlight callout */}
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-center">
              <p className="text-sm font-bold text-red-700">
                Apenas {composition.basePercent}% é remuneração base
              </p>
              <p className="text-[11px] text-red-600">
                O restante são extras que inflam o salário acima do teto
              </p>
            </div>

            {/* Breakdown list */}
            <div className="space-y-2">
              {composition.items.map((item, i) => {
                const pct =
                  composition.total > 0
                    ? (item.value / composition.total) * 100
                    : 0;
                return (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between rounded-lg border ${COMPOSITION_COLORS[i].border} ${COMPOSITION_COLORS[i].light} px-3 py-2`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-sm ${COMPOSITION_COLORS[i].bg}`}
                      />
                      <span className="text-xs font-medium text-gray-700">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {formatCompactCurrency(item.value)}
                      </span>
                      <span
                        className={`text-sm font-bold ${COMPOSITION_COLORS[i].text}`}
                      >
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Salary Comparison - divide by 12 for monthly equivalent */}
          <SalaryComparison
            remuneracao={Math.round(medianRemun / 12)}
            nome="membro mediano acima do teto"
          />
        </div>

        {/* Section 4: O que daria para construir */}
        <section className="mb-6 rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-1 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-navy" />
            <h2 className="font-serif text-lg font-bold text-navy">
              O que daria para construir
            </h2>
          </div>
          <p className="mb-5 text-xs text-gray-500">
            Com os {formatCompactCurrency(totalAcimaTeto)} pagos acima do teto
            em {currentYear}, seria possível construir:
          </p>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {INFRA_ITEMS.map((item) => {
              const quantidade = Math.floor(totalAcimaTeto / item.custo);
              const Icon = item.icon;
              return (
                <div
                  key={item.nome}
                  className={`flex flex-col items-center rounded-xl border ${item.borderColor} ${item.bgColor} p-4 text-center`}
                >
                  <div className="mb-2 rounded-full bg-white p-2 shadow-sm">
                    <Icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <p className="text-3xl font-black text-navy">
                    {formatNumber(quantidade)}
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-700">
                    {item.nome}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    {item.descricao}
                  </p>
                  <p className="mt-2 text-[10px] text-gray-400">
                    ~{formatCompactCurrency(item.custo)}/unidade
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-center text-[11px] text-gray-400">
            Estimativas baseadas em dados do PAC, FNDE e orçamentos públicos.
            Valores aproximados.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
