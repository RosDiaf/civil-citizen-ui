const formatter = new Intl.NumberFormat('en-UK',
  {
    style: 'currency',
    currency: 'GBP',
  });
export default function currencyFormat(amount: number): string {
  return formatter.format(amount);
}