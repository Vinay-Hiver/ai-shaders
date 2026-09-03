# HOT Design System — Colour Tokens

**Source:** Figma file `NH9zVKuqGYXraKuomW7niY` ("HOT Design System") — pages `Colour` (49:222) and `Colour 2` (3667:280)
**Extracted:** 2026-07-27

Two layers of color live in this system:

1. **Primitives** — raw color scales (50 → 950). Never reference these directly in components; they're the palette semantic tokens are built from.
2. **Semantic tokens** — named aliases (`slateBorderLight`, `pastelRedTextBody`, etc.) that map to a primitive value and carry meaning (surface, border, text). **Use these in UI code.**

---

## 1. Primitive Palette

### Slate (neutral / UI chrome)
| Step | Hex |
|------|-----|
| 950 | `#020617` |
| 900 | `#0F172A` |
| 800 | `#1E293B` |
| 700 | `#334155` |
| 600 | `#475569` |
| 500 | `#64758B` |
| 400 | `#94A3B8` |
| 300 | `#CBD5E1` |
| 200 | `#E2E8F0` |
| 100 | `#F1F5F9` |
| 50  | `#F8FAFC` |

### Blue (Primary)
| Step | Hex |
|------|-----|
| 950 | `#020918` |
| 900 | `#041534` |
| 800 | `#072969` |
| 700 | `#0C3E9D` |
| 600 | `#0F53D2` |
| 500 | `#276CF0` |
| 400 | `#538BF3` |
| 300 | `#7EA8F6` |
| 200 | `#A9C5F9` |
| 100 | `#D4E2FC` |
| 50  | `#E6EFFD` |

### Primary Purple
| Step | Hex |
|------|-----|
| 950 | `#000624` |
| 900 | `#000B42` |
| 800 | `#011585` |
| 700 | `#0021C7` |
| 600 | `#1037FF` |
| 500 | `#506DFF` |
| 400 | `#758BFF` |
| 300 | `#94A5FF` |
| 200 | `#B8C2FF` |
| 100 | `#DBE0FF` |
| 50  | `#F0F2FF` |

### Indigo
| Step | Hex |
|------|-----|
| 950 | `#00147A` |
| 900 | `#001DAD` |
| 800 | `#0129F5` |
| 700 | `#0129F5` |
| 600 | `#3D5DFF` |
| 500 | `#506DFF` |
| 400 | `#8B9DFF` |
| 300 | `#ADBBFF` |
| 200 | `#CCD5FE` |
| 100 | `#E5EAFF` |
| 50  | `#F5F7FF` |

### Green (Success)
| Step | Hex |
|------|-----|
| 950 | `#05150C` |
| 900 | `#0A2516` |
| 800 | `#114A2B` |
| 700 | `#1B6F41` |
| 600 | `#239456` |
| 500 | `#2DBB6D` |
| 400 | `#4AD387` |
| 300 | `#77DEA6` |
| 200 | `#A6E9C3` |
| 100 | `#D3F4E1` |
| 50  | `#EAF9F2` |

### Red (Error)
| Step | Hex |
|------|-----|
| 950 | `#120202` |
| 900 | `#230505` |
| 800 | `#480909` |
| 700 | `#6D0D0E` |
| 600 | `#911212` |
| 500 | `#B81717` |
| 400 | `#E42525` |
| 300 | `#EB5C5C` |
| 200 | `#F19192` |
| 100 | `#F9C9C9` |
| 50  | `#FCE4E4` |

### Orange (Warning)
| Step | Hex |
|------|-----|
| 950 | `#170A02` |
| 900 | `#331505` |
| 800 | `#61280B` |
| 700 | `#933E0F` |
| 600 | `#C75314` |
| 500 | `#E96C28` |
| 400 | `#EC8A54` |
| 300 | `#F2A67D` |
| 200 | `#F6C3A7` |
| 100 | `#FBE2D5` |
| 50  | `#FDEDE7` |

### Pastel Green
| Step | Hex |
|------|-----|
| 950 | `#081210` |
| 900 | `#11231F` |
| 800 | `#439986` |
| 700 | `#55B4A0` |
| 600 | `#7FC7B8` |
| 500 | `#A6D8CD` |
| 400 | `#BCE1D9` |
| 300 | `#CDE9E3` |
| 200 | `#DFF1ED` |
| 100 | `#EDF7F5` |
| 50  | `#F8FCFB` |

### Pastel Violet
| Step | Hex |
|------|-----|
| 950 | `#120B12` |
| 900 | `#241627` |
| 800 | `#442B4B` |
| 700 | `#674171` |
| 600 | `#885695` |
| 500 | `#A577B1` |
| 400 | `#B691C0` |
| 300 | `#CAAED1` |
| 200 | `#DBC8DF` |
| 100 | `#EEE5F0` |
| 50  | `#F6F2F9` |

### Pastel Light Blue
| Step | Hex |
|------|-----|
| 950 | `#1B415E` |
| 900 | `#255C87` |
| 800 | `#3784C3` |
| 700 | `#5C9CD1` |
| 600 | `#80B2DB` |
| 500 | `#9CC3E3` |
| 400 | `#B3D1E9` |
| 300 | `#C7DDEF` |
| 200 | `#DBE9F5` |
| 100 | `#EFF5FB` |
| 50  | `#F8FAFD` |

### Pastel Red
| Step | Hex |
|------|-----|
| 950 | `#750B0F` |
| 900 | `#A30F14` |
| 800 | `#DB151A` |
| 700 | `#EE4E54` |
| 600 | `#F16E73` |
| 500 | `#F48A8E` |
| 400 | `#F7ABAE` |
| 300 | `#F9C2C4` |
| 200 | `#FCDADC` |
| 100 | `#FDECED` |
| 50  | `#FFF6F6` |

### Pastel Purple
| Step | Hex |
|------|-----|
| 950 | `#373971` |
| 900 | `#4A4C97` |
| 800 | `#6F71B9` |
| 700 | `#8A8CC6` |
| 600 | `#9FA1D0` |
| 500 | `#B3B4DA` |
| 400 | `#C5C6E3` |
| 300 | `#D6D7EB` |
| 200 | `#E4E4F2` |
| 100 | `#F1F2F8` |
| 50  | `#F8F8FC` |

### Pastel Orange
| Step | Hex |
|------|-----|
| 950 | `#230E06` |
| 900 | `#461C0C` |
| 800 | `#8B3919` |
| 700 | `#D15523` |
| 600 | `#E48762` |
| 500 | `#F0BCA8` |
| 400 | `#F2CBB8` |
| 300 | `#F6D7CB` |
| 200 | `#F8E4DC` |
| 100 | `#FCF2EF` |
| 50  | `#FEF8F6` |

### Pastel Yellow
| Step | Hex |
|------|-----|
| 950 | `#241D00` |
| 900 | `#473900` |
| 800 | `#8F7200` |
| 700 | `#D6AB00` |
| 600 | `#FFD21F` |
| 500 | `#FFE066` |
| 400 | `#FFE785` |
| 300 | `#FFEDA3` |
| 200 | `#FFF3C2` |
| 100 | `#FFF9DF` |
| 50  | `#FEFCF0` |

---

## 2. Semantic Tokens (aliases actually bound in Figma)

These are the named variables referenced by components in the DS file — use these names as CSS custom properties.

### Neutral (Light) scale
| Token | Hex |
|-------|-----|
| `--neutralLight-N900` | `#091E42` |
| `--neutralLight-N800` | `#172B4D` |
| `--neutralLight-N700` | `#253858` |
| `--neutralLight-N600` | `#344563` |
| `--neutralLight-N500` | `#42526E` |
| `--neutralLight-N400` | `#505F79` |
| `--neutralLight-N300` | `#5E6C84` |
| `--neutralLight-N200` | `#6B778C` |
| `--neutralLight-N100` | `#7A869A` |
| `--neutralLight-N90`  | `#8993A4` |
| `--neutralLight-N80`  | `#97A0AF` |
| `--neutralLight-N70`  | `#A5ADBA` |
| `--neutralLight-N60`  | `#B3BAC5` |
| `--neutralLight-N50`  | `#C1C7D0` |
| `--neutralLight-N40`  | `#DFE1E6` |
| `--neutralLight-N30`  | `#EBECF0` |
| `--neutralLight-N20`  | `#F4F5F7` |
| `--neutralLight-N10`  | `#FAFBFC` |
| `--neutralLight-N0`   | `#FFFFFF` |
| `--neutralLight-N20A` (alpha tint) | `#091E42` (with reduced opacity) |

### Slate semantic aliases
| Token | Hex |
|-------|-----|
| `--slateBorderLight` | `#e2e8f0` |
| `--slateTextCaption` | `#cbd5e1` |
| `--slateSurfaceSubtle200` | `#e2e8f0` |

### Pastel semantic pairs (text / surface)
Each pastel family exposes a `TextBody` (for text on a light surface) and `SurfaceDefault` (background chip/badge color) pair.

| Family | TextBody | SurfaceDefault |
|--------|----------|-----------------|
| Purple | `#5b5daf` | `#b7b8dc` |
| Violet | `#9b66a8` | `#caaed1` |
| Light Blue | `#255c87` | `#77add9` |
| Red | `#b22e33` | `#d96d71` |
| Orange | `#c2521b` | `#e98959` |
| Yellow | `#907f13` | `#efdf80` |
| Green | `#2f6e61` | `#75c2b2` |

*(These pastel pairs are the ones used for tags/badges/avatars — e.g. `pastelRedTextBody` + `pastelRedSurfaceDefault`.)*

---

## Notes for implementation
- Prefer semantic tokens over primitives in component CSS; primitives exist so the semantic layer has a source to point to.
- If a new semantic token is needed and not listed above, extend this file rather than reaching for a raw primitive hex in component code.
