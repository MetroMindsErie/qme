# Dashboard Card
A minimal HTML/CSS/JS card with:
- Four editable display fields (dta2dsply1..4)
- Inline-editable headline
- Large metric input
- Two star buttons with independent counters (badges are editable and increment on click)

## Usage
1. Open `index.html` in a browser.
2. Edit the headline, top fields, and the big metric directly on the page.
3. Click the left/right star to increment counts or click the badge text to type a number.

## Programmatic API (window.dashboardCard)
- `setMetric(value)` / `getMetric()`
- `setDisplay(slot, value)` // slot ∈ {1,2,3,4}
- `getDisplays()` // returns array of the four display values
- `setLeft(n)`, `setRight(n)`, `resetStars()`
