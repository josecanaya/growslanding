# Design System Documentation: Architectural Precision & Technical Elegance

## 1. Overview & Creative North Star
This design system is built for the high-end architectural studio—a space where technical rigor meets artistic vision. Our creative North Star is **"The Blueprint of Light."**

Unlike standard digital products that rely on rigid grids and heavy borders, this system treats the screen as an architectural site. We move beyond the "template" look by utilizing intentional asymmetry, expansive negative space, and a tonal layering system that mimics the way light interacts with physical materials. The goal is an editorial experience that feels curated, quiet, and authoritative. Every pixel must feel intentional, as if drafted with a precision compass.

## 2. Colors & Surface Philosophy
The palette is rooted in the "Chalk and Slate" spectrum, providing a neutral, sophisticated stage for our "Technical Blue" (Primary) and "Emerald Spark" (Tertiary) accents.

### The "No-Line" Rule
To maintain a premium, architectural feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries between content areas must be defined solely through background color shifts. For example, a `surface-container-low` section should sit directly against a `surface` background to define its edge. This creates a "soft-edge" transition that feels more like a physical material change than a digital box.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—stacked sheets of frosted glass or fine architectural paper.
*   **Base:** `surface` (#f6fafe) is your ground plane.
*   **Layer 1:** Use `surface-container-low` (#f0f4f8) for large secondary background blocks.
*   **Layer 2:** Use `surface-container-lowest` (#ffffff) for high-importance cards or interactive modules to make them "pop" forward naturally.
*   **Layer 3:** Use `surface-container-highest` (#dfe3e7) sparingly for utility bars or inactive states.

### The "Glass & Gradient" Rule
Floating elements (modals, dropdowns, sticky navs) should utilize glassmorphism. Use semi-transparent `surface` colors with a `backdrop-blur` (12px–20px) to allow the content beneath to bleed through softly. 

**Signature Texture:** For primary CTAs or Hero backgrounds, apply a subtle linear gradient transitioning from `primary` (#001629) to `primary_container` (#002b49). This adds a "technical soul" and depth that prevents the navy from feeling flat or heavy.

## 3. Typography
Our typography is a dialogue between the structural geometric forms of **Manrope** and the technical clarity of **Inter**.

*   **Display & Headlines (Manrope):** These are our "hero" elements. Use `display-lg` (3.5rem) with wide letter-spacing to command attention. Manrope’s modern curves reflect contemporary architectural forms.
*   **Body & Titles (Inter):** Inter handles the "technical specs." It provides high legibility for project descriptions and metadata.
*   **Editorial Hierarchy:** Contrast is key. Pair a massive `display-md` headline with a significantly smaller `body-md` description. The high delta in scale creates a sophisticated, magazine-style layout that signals premium quality.

## 4. Elevation & Depth
In this design system, depth is a matter of light physics, not drop-shadow presets.

*   **The Layering Principle:** Avoid elevation shadows where possible. Instead, achieve depth by "stacking" surface tiers. A `surface-container-lowest` card sitting on a `surface-container-low` section provides a natural, clean lift.
*   **Ambient Shadows:** When a floating effect is required (e.g., a primary project card), use an extra-diffused shadow. 
    *   *Values:* Y: 12px, Blur: 32px.
    *   *Color:* Use a 6% opacity version of `on_surface` (#171c1f) rather than pure black to mimic natural ambient light.
*   **The "Ghost Border" Fallback:** If a container requires a border for accessibility (e.g., an input field), use a "Ghost Border." Apply `outline-variant` at 15% opacity. Never use 100% opaque borders.
*   **Glassmorphism:** Use `surface_variant` at 70% opacity with a heavy blur for navigation overlays. This ensures the UI feels integrated into the space, not "pasted" on top.

## 5. Components

### Buttons
*   **Primary:** `primary` background with `on_primary` text. Use `xl` (1.5rem/24px) rounded corners. For a signature touch, add a subtle 2px inner-glow (white at 10%) on the top edge.
*   **Secondary:** `surface-container-high` background with `primary` text. No border.
*   **Tertiary (Accent):** Use `on_tertiary_container` (Emerald Green) for text-only buttons to highlight "Action" or "Success" states within a technical context.

### Cards & Lists
*   **Rule:** Forbid divider lines.
*   **Implementation:** Use vertical white space (32px, 48px, or 64px) to separate list items. For cards, use the Surface Hierarchy (e.g., a `surface-container-lowest` card on a `surface` background).
*   **Corner Radius:** Consistently use `xl` (24px) for cards and `lg` (16px) for inner nested elements.

### Input Fields
*   **Style:** Background-less or `surface-container-low`.
*   **Focus State:** Transition the "Ghost Border" from 15% to 100% `tertiary_container` (Emerald). This provides a sharp, technical "spark" of color that signals precision.

### Chips & Tags
*   **Selection Chips:** Use `secondary_container` with `on_secondary_container`. Use the `full` roundedness (pill shape) to contrast against the more structured architectural cards.

### Tooltips & Overlays
*   **Styling:** Use `inverse_surface` (#2c3134) for tooltips to create high-contrast "technical callouts" against the light backgrounds.

## 6. Do's and Don'ts

### Do
*   **Embrace Asymmetry:** Align a headline to the left and the body text to a 60% offset to the right. Create "breathing room."
*   **Use Tonal Transitions:** Shift background colors between sections (e.g., from `surface` to `surface-container-low`) to signal a change in content.
*   **Precision Geometry:** Ensure all icons and elements are aligned to a strict 8px or 4px grid, but feel free to break the "standard" container widths.

### Don't
*   **No Clutter:** If an element doesn't serve a functional or high-level aesthetic purpose, remove it.
*   **No High-Contrast Dividers:** Never use a dark line to separate content. Use space.
*   **No Default Shadows:** Avoid the "fuzzy" dark shadows typical of basic web templates. If it doesn't look like light hitting a surface, it's wrong.
*   **No Pure Black:** Use `primary` (#001629) for your darkest tones to maintain the "Technical Blue" signature.