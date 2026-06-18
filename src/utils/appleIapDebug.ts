import { IAP_DETAILED_LOGS } from '../config/api';

let flowStartMs = 0;
let stepStartMs = 0;
let activeFlowLabel: string | null = null;

function summarize(value: unknown, maxLen = 400): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'string') {
    const oneLine = value.replace(/\s+/g, ' ').trim();
    return oneLine.length > maxLen ? `${oneLine.slice(0, maxLen)}…` : oneLine;
  }
  try {
    const s = JSON.stringify(value);
    return s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
  } catch {
    return String(value).slice(0, maxLen);
  }
}

function enabled(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__ && IAP_DETAILED_LOGS;
}

export function iapLogFlowStart(label: string, details?: Record<string, unknown>): void {
  if (!enabled()) return;
  flowStartMs = Date.now();
  stepStartMs = flowStartMs;
  activeFlowLabel = label;
  const detailLines = details
    ? Object.entries(details)
        .map(([key, value]) => `│ ${key}: ${summarize(value)}`)
        .join('\n')
    : '';
  console.log(
    `[AppleIAP] ┌── START ${label}\n` +
      (detailLines ? `${detailLines}\n` : '') +
      `│ time: ${new Date().toISOString()}`
  );
}

export function iapLogStep(step: string, details?: Record<string, unknown>): void {
  if (!enabled()) return;
  const now = Date.now();
  const sinceFlow = flowStartMs > 0 ? now - flowStartMs : 0;
  const sinceStep = stepStartMs > 0 ? now - stepStartMs : 0;
  stepStartMs = now;
  const detailLines = details
    ? Object.entries(details)
        .map(([key, value]) => `│ ${key}: ${summarize(value)}`)
        .join('\n')
    : '';
  console.log(
    `[AppleIAP] ├── ${step} (+${sinceStep}ms, total ${sinceFlow}ms)\n` +
      (detailLines ? `${detailLines}` : '')
  );
}

export function iapLogWait(step: string, details?: Record<string, unknown>): void {
  iapLogStep(`${step} — waiting…`, details);
}

export function iapLogFlowEnd(outcome: 'success' | 'error' | 'cancelled', message?: string): void {
  if (!enabled()) return;
  const totalMs = flowStartMs > 0 ? Date.now() - flowStartMs : 0;
  const label = activeFlowLabel ?? 'purchase';
  const icon = outcome === 'success' ? 'OK' : outcome === 'cancelled' ? 'CANCELLED' : 'ERROR';
  console.log(
    `[AppleIAP] └── ${icon} ${label} | ${totalMs}ms` + (message ? `\n│ message: ${summarize(message, 600)}` : '')
  );
  flowStartMs = 0;
  stepStartMs = 0;
  activeFlowLabel = null;
}

export function iapLogPurchaseSnapshot(purchase: Record<string, unknown>, label = 'purchase'): void {
  if (!enabled()) return;
  iapLogStep(`snapshot:${label}`, {
    productId: purchase.productId,
    transactionId: purchase.transactionId ?? purchase.id,
    originalTransactionId:
      purchase.originalTransactionIdentifierIOS ?? purchase.originalTransactionId,
    expirationDateIOS: purchase.expirationDateIOS,
    environmentIOS: purchase.environmentIOS,
    transactionDate: purchase.transactionDate,
  });
}
