/**
 * Format a dollar amount with k/M/B notation for large values
 * Returns both the formatted string and the full value
 */
export const formatCompactCurrency = (
  amount: number,
): { formatted: string; full: string } => {
  const full = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (amount < 10000) {
    return { formatted: full, full };
  }

  // Format with k/M/B notation
  if (amount >= 1_000_000_000) {
    const formatted = `$${(amount / 1_000_000_000).toFixed(1)}B`;
    return { formatted, full: `$${full}` };
  } else if (amount >= 1_000_000) {
    const formatted = `$${(amount / 1_000_000).toFixed(1)}M`;
    return { formatted, full: `$${full}` };
  } else {
    const formatted = `$${(amount / 1000).toFixed(1)}k`;
    return { formatted, full: `$${full}` };
  }
};
