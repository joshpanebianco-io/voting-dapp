import { formatEther } from "ethers";
import { CHAIN } from "../config";

export function shortAddress(address, chars = 4) {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

export function isSameAddress(a, b) {
  return Boolean(a && b) && a.toLowerCase() === b.toLowerCase();
}

/** Seconds -> "2d 3h", "4h 12m", "12m 05s", "45s". */
export function formatDuration(totalSeconds, { compact = false } = {}) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (days > 0) return compact ? `${days}d` : `${days}d ${hours}h`;
  if (hours > 0) return compact ? `${hours}h` : `${hours}h ${pad(minutes)}m`;
  if (minutes > 0) return compact ? `${minutes}m` : `${minutes}m ${pad(seconds)}s`;
  return `${seconds}s`;
}

/** Minutes -> "15 min", "2 hours", "3 days". */
export function formatMinutes(minutes) {
  const m = Number(minutes) || 0;
  if (m % (24 * 60) === 0 && m >= 24 * 60) {
    const d = m / (24 * 60);
    return `${d} ${d === 1 ? "day" : "days"}`;
  }
  if (m % 60 === 0 && m >= 60) {
    const h = m / 60;
    return `${h} ${h === 1 ? "hour" : "hours"}`;
  }
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return `${m} min`;
}

const dateFmt = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const shortDateFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

export function formatDate(unixSeconds) {
  if (!unixSeconds) return "";
  return dateFmt.format(new Date(unixSeconds * 1000));
}

export function formatShortDate(unixSeconds) {
  if (!unixSeconds) return "";
  return shortDateFmt.format(new Date(unixSeconds * 1000));
}

const relFmt = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

/** Unix seconds -> "3 days ago", "in 2 hours". */
export function formatRelative(unixSeconds, nowSeconds = Date.now() / 1000) {
  const diff = unixSeconds - nowSeconds;
  const abs = Math.abs(diff);
  if (abs < 60) return relFmt.format(Math.round(diff), "second");
  if (abs < 3600) return relFmt.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return relFmt.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return relFmt.format(Math.round(diff / 86400), "day");
  return relFmt.format(Math.round(diff / (86400 * 30)), "month");
}

export function percent(count, total) {
  if (!total) return 0;
  return (count / total) * 100;
}

export function formatPercent(value, digits = 0) {
  return `${Number(value).toFixed(digits)}%`;
}

export function formatEth(wei, digits = 4) {
  if (wei == null) return "—";
  const value = Number(formatEther(wei));
  if (value === 0) return `0 ${CHAIN.currency.symbol}`;
  if (value < 0.0001) return `<0.0001 ${CHAIN.currency.symbol}`;
  return `${value.toFixed(digits).replace(/\.?0+$/, "")} ${CHAIN.currency.symbol}`;
}

export function formatCount(n, singular, plural = `${singular}s`) {
  const value = Number(n) || 0;
  return `${value.toLocaleString()} ${value === 1 ? singular : plural}`;
}

export function explorerUrl(type, value) {
  if (!CHAIN.explorer || !value) return null;
  return `${CHAIN.explorer}/${type}/${value}`;
}

function pad(n) {
  return String(n).padStart(2, "0");
}
