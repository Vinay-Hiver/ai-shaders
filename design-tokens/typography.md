# HOT Design System — Typography Tokens

**Source:** Figma file `NH9zVKuqGYXraKuomW7niY` ("HOT Design System") — page `Typography` (48:63)
**Extracted:** 2026-07-27
**Font:** [Hanken Grotesk](https://fonts.google.com/specimen/Hanken+Grotesk) — Medium (500) for Headings/Labels, Regular (400) for Body

Scale: minor third (×1.2), sizes and line-heights rounded to the nearest 4px.

---

## Headings — Medium (500)
| Style | Size | Line height | Weight |
|-------|------|-------------|--------|
| H1 | 36px | 44px | 500 |
| H2 | 30px | 36px | 500 |
| H3 | 24px | 28px | 500 |
| H4 | 20px | 24px | 500 |

## Labels — Medium (500)
| Style | Size | Line height | Weight |
|-------|------|-------------|--------|
| Large  | 18px | 28px | 500 |
| Medium | 16px | 24px | 500 |
| Small  | 14px | 20px | 500 |
| xSmall | 12px | 18px | 500 |

## Body — Regular (400)
| Style | Size | Line height | Weight |
|-------|------|-------------|--------|
| Large  | 18px | 28px | 400 |
| Medium | 16px | 24px | 400 |
| Small  | 14px | 20px | 400 |
| xSmall | 12px | 18px | 400 |

---

## CSS custom properties

```css
@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500&display=swap');

:root {
  --font-family: 'Hanken Grotesk', sans-serif;

  /* Headings */
  --heading-h1-size: 36px; --heading-h1-line-height: 44px; --heading-h1-weight: 500;
  --heading-h2-size: 30px; --heading-h2-line-height: 36px; --heading-h2-weight: 500;
  --heading-h3-size: 24px; --heading-h3-line-height: 28px; --heading-h3-weight: 500;
  --heading-h4-size: 20px; --heading-h4-line-height: 24px; --heading-h4-weight: 500;

  /* Labels */
  --label-large-size: 18px;  --label-large-line-height: 28px;  --label-large-weight: 500;
  --label-medium-size: 16px; --label-medium-line-height: 24px; --label-medium-weight: 500;
  --label-small-size: 14px;  --label-small-line-height: 20px;  --label-small-weight: 500;
  --label-xsmall-size: 12px; --label-xsmall-line-height: 18px; --label-xsmall-weight: 500;

  /* Body */
  --body-large-size: 18px;  --body-large-line-height: 28px;  --body-large-weight: 400;
  --body-medium-size: 16px; --body-medium-line-height: 24px; --body-medium-weight: 400;
  --body-small-size: 14px;  --body-small-line-height: 20px;  --body-small-weight: 400;
  --body-xsmall-size: 12px; --body-xsmall-line-height: 18px; --body-xsmall-weight: 400;
}
```

## Rules of thumb
- Heading line-height ≈ font-size × 1.2, rounded to nearest 4px.
- Body line-height ≈ font-size × 1.5, rounded to nearest 4px.
- Headings and Labels use Medium (500); Body uses Regular (400).
