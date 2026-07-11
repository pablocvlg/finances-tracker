"use client";

import type { RangePreset } from "@/lib/dateRange";
import styles from "./DateRangeSelector.module.css";

const presets: { value: RangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "custom", label: "Custom" },
];

export default function DateRangeSelector({
  value,
  custom,
  onChange,
  onCustomChange,
}: {
  value: RangePreset;
  custom: { from: string; to: string };
  onChange: (preset: RangePreset) => void;
  onCustomChange: (custom: { from: string; to: string }) => void;
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.presets} role="group" aria-label="Date range">
        {presets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            className={value === preset.value ? styles.active : styles.option}
            onClick={() => onChange(preset.value)}
            aria-pressed={value === preset.value}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {value === "custom" && (
        <div className={styles.customRange}>
          <input
            type="date"
            value={custom.from}
            max={custom.to}
            onChange={(e) => onCustomChange({ ...custom, from: e.target.value })}
          />
          <span className={styles.separator}>to</span>
          <input
            type="date"
            value={custom.to}
            min={custom.from}
            onChange={(e) => onCustomChange({ ...custom, to: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
