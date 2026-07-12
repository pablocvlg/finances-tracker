"use client";

import { useEffect, useMemo, useState } from "react";
import CurrencyToggle from "@/components/CurrencyToggle";
import {
  formatCurrency,
  parseAmount,
  sumInCurrency,
  type Currency,
  type CurrencyTotals,
} from "@/lib/currency";
import { addMonths } from "@/lib/recurrence";
import styles from "../shared.module.css";
import pageStyles from "./page.module.css";

type Mode = "goal" | "projection";

type SavingsRate = {
  months: number;
  history: { month: string; net: CurrencyTotals }[];
  average: CurrencyTotals;
};

function monthsBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  let months = (ty - fy) * 12 + (tm - fm);
  if (td < fd) months -= 1;
  return months;
}

export default function Simulator() {
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [mode, setMode] = useState<Mode>("goal");
  const [netWorth, setNetWorth] = useState<CurrencyTotals | null>(null);

  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [startOverride, setStartOverride] = useState("");
  const [lookback, setLookback] = useState(6);
  const [rate, setRate] = useState<SavingsRate | null>(null);

  useEffect(() => {
    fetch("/api/net-worth")
      .then((res) => res.json())
      .then((data) => setNetWorth(data.total));
  }, []);

  useEffect(() => {
    fetch(`/api/savings-rate?months=${lookback}`)
      .then((res) => res.json())
      .then(setRate);
  }, [lookback]);

  const today = new Date().toISOString().slice(0, 10);
  const netWorthDisplay = netWorth ? sumInCurrency(netWorth, currency) : 0;
  const startParsed = parseAmount(startOverride);
  const start = !isNaN(startParsed) ? startParsed : netWorthDisplay;
  const targetValue = parseAmount(target);

  const goalResult = useMemo(() => {
    if (!targetValue || !deadline || deadline <= today) return null;
    if (targetValue <= start) return { reached: true as const };
    const months = Math.max(monthsBetween(today, deadline), 1);
    return { reached: false as const, months, perMonth: (targetValue - start) / months };
  }, [targetValue, deadline, today, start]);

  const projectionResult = useMemo(() => {
    if (!targetValue || !rate) return null;
    if (targetValue <= start) return { reached: true as const };
    const monthlyRate = sumInCurrency(rate.average, currency);
    if (monthlyRate <= 0) return { reached: false as const, monthlyRate, months: null };
    const months = Math.ceil((targetValue - start) / monthlyRate);
    return { reached: false as const, monthlyRate, months, date: addMonths(today, months) };
  }, [targetValue, rate, start, currency, today]);

  return (
    <main className={styles.main}>
      <div className={styles.headerRow}>
        <h1 className={styles.heading}>Simulator</h1>
        <CurrencyToggle value={currency} onChange={setCurrency} />
      </div>

      <div className={pageStyles.modes} role="group" aria-label="Simulator mode">
        <button
          type="button"
          className={mode === "goal" ? pageStyles.modeActive : pageStyles.mode}
          onClick={() => setMode("goal")}
          aria-pressed={mode === "goal"}
        >
          Required savings
        </button>
        <button
          type="button"
          className={mode === "projection" ? pageStyles.modeActive : pageStyles.mode}
          onClick={() => setMode("projection")}
          aria-pressed={mode === "projection"}
        >
          Projection
        </button>
      </div>

      <div className={pageStyles.fields}>
        <label className={pageStyles.field}>
          <span className={pageStyles.label}>Target amount ({currency})</span>
          <input
            type="text"
            inputMode="decimal"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="e.g. 50000"
          />
        </label>

        <label className={pageStyles.field}>
          <span className={pageStyles.label}>Starting amount ({currency})</span>
          <input
            type="text"
            inputMode="decimal"
            value={startOverride}
            onChange={(e) => setStartOverride(e.target.value)}
            placeholder={netWorth ? formatCurrency(netWorthDisplay, currency) : "…"}
          />
          <span className={pageStyles.hint}>Blank uses current net worth</span>
        </label>

        {mode === "goal" ? (
          <label className={pageStyles.field}>
            <span className={pageStyles.label}>Deadline</span>
            <input
              type="date"
              value={deadline}
              min={today}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </label>
        ) : (
          <label className={pageStyles.field}>
            <span className={pageStyles.label}>Based on the last</span>
            <select value={lookback} onChange={(e) => setLookback(Number(e.target.value))}>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
            </select>
          </label>
        )}
      </div>

      <div className={pageStyles.result}>
        {mode === "goal" &&
          (goalResult === null ? (
            <p className={styles.placeholder}>Enter a target amount and a future deadline.</p>
          ) : goalResult.reached ? (
            <p className={pageStyles.resultLine}>Target is already covered by the starting amount.</p>
          ) : (
            <>
              <p className={pageStyles.resultValue}>
                {formatCurrency(goalResult.perMonth, currency)} / month
              </p>
              <p className={pageStyles.resultLine}>
                {goalResult.months} months until the deadline, starting from{" "}
                {formatCurrency(start, currency)}.
              </p>
            </>
          ))}

        {mode === "projection" &&
          (projectionResult === null ? (
            <p className={styles.placeholder}>Enter a target amount.</p>
          ) : projectionResult.reached ? (
            <p className={pageStyles.resultLine}>Target is already covered by the starting amount.</p>
          ) : projectionResult.months === null ? (
            <p className={pageStyles.resultLine}>
              Average savings over this period is{" "}
              {formatCurrency(projectionResult.monthlyRate, currency)} / month — the target is not
              reachable at the current rate.
            </p>
          ) : (
            <>
              <p className={pageStyles.resultValue}>{projectionResult.date}</p>
              <p className={pageStyles.resultLine}>
                About {projectionResult.months} months at the current rate of{" "}
                {formatCurrency(projectionResult.monthlyRate, currency)} / month.
              </p>
            </>
          ))}
      </div>
    </main>
  );
}
