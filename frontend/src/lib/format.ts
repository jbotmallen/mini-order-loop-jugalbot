const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const dateTime = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

export function formatMoney(value: string | number | null): string {
  return money.format(Number(value ?? 0))
}

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso))
}
