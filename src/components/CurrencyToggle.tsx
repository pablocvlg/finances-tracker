"use client";

import type { Currency } from "@/lib/currency";
import styles from "./CurrencyToggle.module.css";

export default function CurrencyToggle({
  value,
  onChange,
}: {
  value: Currency;
  onChange: (currency: Currency) => void;
}) {
  return (
    <div className={styles.toggle} role="group" aria-label="Display currency">
      {(["EUR", "DKK"] as const).map((currency) => (
        <button
          key={currency}
          type="button"
          className={value === currency ? styles.active : styles.option}
          onClick={() => onChange(currency)}
          aria-pressed={value === currency}
        >
          {currency}
        </button>
      ))}
    </div>
  );
}
