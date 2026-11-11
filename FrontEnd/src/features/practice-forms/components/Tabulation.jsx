/*
 * @institucion   Universidad Nacional de Loja
 * @carrera       Pedagogía de las Ciencias Experimentales - Informática
 * @asignatura    Programación Web
 * @docente       Johnny H. Sánchez L.
 * @proyecto      Sistema de Gestión de Prácticas (SGP)
 * @estudiante    Cristhian Hipólito Girón Chamba (cristhian.giron@unl.edu.ec)
 * @file          Tabulation.jsx
 * @fecha         2026-11-11 10:29:41
 * @nota          Implementa el componente Tabulation de la interfaz del SGP.
 */

import { InfoLine } from "./FormInfo";
import { Select } from "../../../components/ui/FormControls";
import { useState } from "react";

export function Tabulation({ question }) {
  const [chartType, setChartType] = useState(() => ['SINGLE_CHOICE', 'YES_NO'].includes(question.type) ? 'pie' : 'bar');
  const counts = Object.entries(question.tabulation?.counts || {});
  if (['SCALE', 'NUMBER'].includes(question.type)) counts.sort(([a], [b]) => Number(a) - Number(b));
  const total = counts.length ? counts.reduce((sum, [, count]) => sum + (Number(count) || 0), 0) : question.tabulation?.numericCount || 0;
  const multipleChoice = question.type === 'MULTIPLE_CHOICE';
  const totalLabel = multipleChoice
    ? total === 1 ? 'selección registrada' : 'selecciones registradas'
    : total === 1 ? 'respuesta registrada' : 'respuestas registradas';
  const numericCount = question.tabulation?.numericCount || 0;
  const hasNumericStats = ['SCALE', 'NUMBER'].includes(question.type) && numericCount > 0;
  const pieChart = chartType === 'pie';

  if (!counts.length && !hasNumericStats) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-line bg-panel p-3 dark:border-line dark:bg-surface" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-heading">Resumen cuantitativo</p>
          <p className="mt-1 text-xs text-body">
            {total} {totalLabel} en este formulario.
            {multipleChoice && ' Los porcentajes se calculan sobre el total de selecciones.'}
          </p>
        </div>
        {counts.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-body print:hidden">
            Tipo de gráfico
            <Select aria-label={`Tipo de gráfico de la pregunta ${question.order ?? question.id ?? ''}`} value={chartType} onChange={event => setChartType(event.target.value)}>
              <option value="bar">Barras</option>
              <option value="pie">Pastel</option>
            </Select>
          </label>
        )}
      </div>
      {counts.length > 0 && (
        <div className="grid min-w-0 gap-4 rounded-lg border border-line bg-panel-soft p-4 dark:border-line dark:bg-surface-soft md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row md:flex-col">
            {pieChart ? <PieChart counts={counts} multipleChoice={multipleChoice} /> : <BarChart counts={counts} />}
            <ChartLegend counts={counts} showPercentages={pieChart} />
          </div>
          <div className="min-w-0 max-w-full overflow-hidden rounded-lg border border-line bg-panel shadow-card dark:border-line dark:bg-surface">
            <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
                <thead className="bg-primary-soft text-left text-xs font-semibold uppercase text-body dark:bg-surface-soft dark:text-ink">
                  <tr>
                    <th className="border-b border-line px-4 py-3 dark:border-line">Valor</th>
                    <th className="border-b border-line px-4 py-3 dark:border-line">Frecuencia</th>
                    <th className="border-b border-line px-4 py-3 dark:border-line">Porcentaje</th>
                  </tr>
                </thead>
                <tbody>
                  {counts.map(([label, count]) => (
                    <tr className="even:bg-panel-soft hover:bg-primary-soft dark:even:bg-page/40 dark:hover:bg-info-soft" key={label}>
                      <td className="border-b border-line-soft px-4 py-3 text-body dark:border-line dark:text-ink">{label}</td>
                      <td className="border-b border-line-soft px-4 py-3 text-body dark:border-line dark:text-ink">{count}</td>
                      <td className="border-b border-line-soft px-4 py-3 text-body dark:border-line dark:text-ink">{(total > 0 ? Number(count) / total * 100 : 0).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {hasNumericStats && (
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
          <InfoLine label="Respuestas" value={numericCount} />
          <InfoLine label="Promedio" value={question.tabulation.numericAverage} />
          <InfoLine label="Mínimo" value={question.tabulation.numericMin} />
          <InfoLine label="Máximo" value={question.tabulation.numericMax} />
        </div>
      )}
    </div>
  );
}

const CHART_COLORS = ['#0e7490', '#16a34a', '#f59e0b', '#8b5cf6', '#ef4444', '#0891b2', '#db2777', '#65a30d'];

function ChartLegend({ counts, showPercentages }) {
  const total = counts.reduce((sum, [, count]) => sum + (Number(count) || 0), 0);

  return (
    <ul className="grid min-w-0 gap-2 text-sm">
      {counts.map(([label, count], index) => {
        const percentage = total > 0 ? ((Number(count) || 0) / total) * 100 : 0;

        return (
          <li className="flex min-w-0 items-center gap-2" key={label}>
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <span className="min-w-0 break-words text-body dark:text-ink">
              {label}: <strong>{count}</strong>
              {showPercentages && ` (${percentage.toFixed(1)}%)`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function PieChart({ counts, multipleChoice = false }) {
  const slices = counts
    .map(([label, value], index) => ({ label, value: Number(value) || 0, index }))
    .filter((slice) => slice.value > 0);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  let startAngle = 0;

  return (
    <svg
      aria-label={`Gráfico circular de distribución de respuestas, ${total} ${multipleChoice ? (total === 1 ? 'selección' : 'selecciones') : (total === 1 ? 'respuesta' : 'respuestas')}`}
      className="h-40 w-40 shrink-0"
      role="img"
      viewBox="0 0 160 160"
    >
      {total === 0 ? (
        <circle cx="80" cy="80" r="72" fill="#cbd5e1" />
      ) : slices.length === 1 ? (
        <circle cx="80" cy="80" r="72" fill={CHART_COLORS[slices[0].index % CHART_COLORS.length]} />
      ) : (
        slices.map((slice) => {
          const endAngle = startAngle + (slice.value / total) * 360;
          const path = pieSlicePath(startAngle, endAngle);
          startAngle = endAngle;
          return (
            <path
              d={path}
              fill={CHART_COLORS[slice.index % CHART_COLORS.length]}
              key={slice.label}
              stroke="var(--color-surface)"
              strokeWidth="2"
            />
          );
        })
      )}
      {total === 0 && (
        <text fill="#475569" fontSize="11" textAnchor="middle" x="80" y="84">
          Sin respuestas
        </text>
      )}
    </svg>
  );
}

function pieSlicePath(startAngle, endAngle) {
  const start = piePoint(startAngle);
  const end = piePoint(endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M 80 80 L ${start.x} ${start.y} A 72 72 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

function piePoint(angle) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: 80 + 72 * Math.cos(radians),
    y: 80 + 72 * Math.sin(radians),
  };
}

function BarChart({ counts }) {
  const maxCount = Math.max(...counts.map(([, count]) => Number(count) || 0), 0);

  return (
    <div
      aria-label="Gráfico de barras con la frecuencia de cada respuesta"
      className="grid w-full min-w-0 gap-3"
      role="img"
    >
      {counts.map(([label, value], index) => {
        const count = Number(value) || 0;
        const width = maxCount > 0 ? (count / maxCount) * 100 : 0;

        return (
          <div className="min-w-0" key={label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 break-words font-medium text-body dark:text-ink">{label}</span>
              <strong className="shrink-0 text-heading dark:text-heading">{count}</strong>
            </div>
            <div aria-hidden="true" className="h-3 overflow-hidden rounded-full bg-page dark:bg-page">
              <div
                className="h-full rounded-full transition-[width]"
                style={{
                  backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  width: `${width}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

