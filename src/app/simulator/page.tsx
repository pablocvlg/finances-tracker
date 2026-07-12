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

type Mode = "goal" | "projection" | "plan";

type SavingsRate = {
  months: number;
  history: { month: string; net: CurrencyTotals }[];
  average: CurrencyTotals;
};

const MAX_LOOKBACK = 60;

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

  const [lookbackChoice, setLookbackChoice] = useState("6");
  const [lookbackCustom, setLookbackCustom] = useState("");
  const [rate, setRate] = useState<SavingsRate | null>(null);

  const [monthlySaving, setMonthlySaving] = useState("");
  const [duration, setDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState<"months" | "years">("months");

  const lookback =
    lookbackChoice === "custom"
      ? Math.min(Math.max(parseInt(lookbackCustom, 10) || 0, 0), MAX_LOOKBACK)
      : Number(lookbackChoice);

  useEffect(() => {
    fetch("/api/net-worth")
      .then((res) => res.json())
      .then((data) => setNetWorth(data.total));
  }, []);

  useEffect(() => {
    if (lookback < 1) return;
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

  const planResult = useMemo(() => {
    const monthly = parseAmount(monthlySaving);
    const n = parseInt(duration, 10);
    if (isNaN(monthly) || monthly <= 0 || isNaN(n) || n < 1) return null;
    const months = durationUnit === "years" ? n * 12 : n;
    const contributed = monthly * months;
    return { months, monthly, contributed, final: start + contributed };
  }, [monthlySaving, duration, durationUnit, start]);

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
        <button
          type="button"
          className={mode === "plan" ? pageStyles.modeActive : pageStyles.mode}
          onClick={() => setMode("plan")}
          aria-pressed={mode === "plan"}
        >
          Savings plan
        </button>
      </div>

      <div className={pageStyles.fields}>
        {mode !== "plan" && (
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
        )}

        {mode === "plan" && (
          <>
            <label className={pageStyles.field}>
              <span className={pageStyles.label}>Saving per month ({currency})</span>
              <input
                type="text"
                inputMode="decimal"
                value={monthlySaving}
                onChange={(e) => setMonthlySaving(e.target.value)}
                placeholder="e.g. 500"
              />
            </label>
            <label className={pageStyles.field}>
              <span className={pageStyles.label}>For how long</span>
              <div className={pageStyles.inlinePair}>
                <input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 24"
                />
                <select
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value as "months" | "years")}
                >
                  <option value="months">months</option>
                  <option value="years">years</option>
                </select>
              </div>
            </label>
          </>
        )}

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

        {mode === "goal" && (
          <label className={pageStyles.field}>
            <span className={pageStyles.label}>Deadline</span>
            <input
              type="date"
              value={deadline}
              min={today}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </label>
        )}

        {mode === "projection" && (
          <label className={pageStyles.field}>
            <span className={pageStyles.label}>Based on the last</span>
            <div className={pageStyles.inlinePair}>
              <select
                value={lookbackChoice}
                onChange={(e) => setLookbackChoice(e.target.value)}
              >
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="24">24 months</option>
                <option value="custom">Custom…</option>
              </select>
              {lookbackChoice === "custom" && (
                <input
                  type="number"
                  min="1"
                  max={MAX_LOOKBACK}
                  value={lookbackCustom}
                  onChange={(e) => setLookbackCustom(e.target.value)}
                  placeholder="months"
                />
              )}
            </div>
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
          (lookback < 1 ? (
            <p className={styles.placeholder}>Enter a lookback period in months.</p>
          ) : projectionResult === null ? (
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

        {mode === "plan" &&
          (planResult === null ? (
            <p className={styles.placeholder}>Enter a monthly amount and a duration.</p>
          ) : (
            <>
              <p className={pageStyles.resultValue}>
                {formatCurrency(planResult.final, currency)}
              </p>
              <p className={pageStyles.resultLine}>
                After {planResult.months} months saving{" "}
                {formatCurrency(planResult.monthly, currency)} / month you save{" "}
                {formatCurrency(planResult.contributed, currency)}, on top of the{" "}
                {formatCurrency(start, currency)} you start with.
              </p>
            </>
          ))}
      </div>
    </main>
  );
}
