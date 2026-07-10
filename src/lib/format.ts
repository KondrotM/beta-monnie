/** Format a price in pounds for display: 12.5 → "£12.50". */
export function formatPrice(pounds: number): string {
	return `£${pounds.toFixed(2)}`;
}
