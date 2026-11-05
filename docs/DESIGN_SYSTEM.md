# Design System

## Direction

Approved direction: minimalist editorial interface; white or restrained off-white surfaces; lightweight Inter sans serif; standard blue links; grey borders/separators; simple layouts; no gradients, shadows, or ornamental UI. The current CSS lives in `apps/web/app/*.css`; this document describes the implemented system, not a new one.

## Typography

Inter is loaded in the root layout through `next/font/google` and applied with `--font-inter`, followed by `Inter, Arial, sans-serif` fallbacks. Final typography overrides are in `typography.css`.

| Use | Current implementation |
| --- | --- |
| Base text | 18px, weight 400, line-height 1.5 |
| Brand | weight 500, tight negative tracking |
| Navigation | weight 400; selected tabs may use 500 |
| Main/section headings | weight 400 |
| Article/list titles | weight 400–500 |
| Buttons/actions | weight 500 |
| Article body | 18px desktop / 17.6px mobile, 1.75 line-height |
| Featured title/deck/meta | 30px / 18px / 14px on desktop; title reduces to 1.55rem at <=640px |
| Contribution-card heading/body/link | 23px / 16px at 1.5 / 16px |

## Colour and borders

The main background is `#fff`; account and mobile areas use `#fdfaf6`. Text is primarily `#111` (account pages use dark blue `#101f58`). Links retain browser-style blue `#00e`. Borders use neutral greys (`#999`, `#aaa`, `#bbb`, `#d5d5d5`) with restrained tinted panels: featured `#f4fbf4`, improve `#f2f8ff`, and community `#fdf9f1`. Active navigation uses `#edf5ff`. Existing component-specific focus and status colours are preserved.

## Components

- `SiteShell`: desktop header, search, desktop rail/navigation, footer, mobile drawer and bottom navigation.
- Homepage: feed tabs, featured article, two contribution cards, topic/trending rail.
- Content: list items, prose blocks, article reader, article sources, seed notice, discussions, profile pages.
- Account/auth: sign-in/register form, avatar popover, settings, saved articles, and own-article views.

## Layout and responsive behaviour

The shell uses a three-column desktop grid; at <=850px it becomes navigation plus content with the rail below, and at <=640px it becomes a single column with fixed bottom navigation. Homepage cards stack below 640px. The approved typography change must not alter grid dimensions, spacing, colours, borders, or alignment.

## Accessibility notes

Inputs have labels or `aria-label`s, navigation has labels, icons are hidden when decorative, and reduced-motion CSS disables animation/transition. The code has not been audited for WCAG conformance; contrast, focus visibility across all controls, semantic heading order, and keyboard behaviour remain validation work.
