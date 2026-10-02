# Companion miniatures

The profile picker and bottom-right tutor use four generated, transparent PNG miniatures. They follow the owner's supplied knight, red-haired elf, orc and dwarf references in a consistent painted tabletop style. This is an unofficial fantasy fan-inspired presentation, with no affiliation or endorsement implied.

## Assets

| Race  | Delivered asset                      | Reference screenshot suffix            |
| ----- | ------------------------------------ | -------------------------------------- |
| Human | `public/images/companions/human.png` | `c9cd6081-bde5-47b1-957b-c9fa5b003bb5` |
| Elf   | `public/images/companions/elf.png`   | `f987445c-6ebf-457b-9f66-dc626b448e1c` |
| Orc   | `public/images/companions/orc.png`   | `0b6d5a9f-1231-4595-94fb-080eb846f113` |
| Dwarf | `public/images/companions/dwarf.png` | `47d13fe9-d97e-455e-af7f-35cceff06bb5` |

Mode: built-in ImageGen, reference-based edit, transparent background. Exactly one reference and one generated character per call. Delivered PNGs are 420 pixels high; alpha was retained during high-quality resizing. They are served from the same origin, with no runtime image-generation requests. Original user screenshots are not redistributed.

## Shared prompt

> Use the attached character reference only for character design and wardrobe. Create ONE small full-body collectible fantasy RPG companion miniature: [character]. Match a moonlit forest dark fantasy learning website. Slightly oversized head, compact readable proportions, beautifully painted realistic tabletop miniature, muted moss green and aged silver, friendly helpful stance, 3/4 view facing toward viewer and slightly left. Entire figure including boots visible with generous transparent padding. Crisp silhouette readable at 110px tall. TRANSPARENT background, no platform, no checkerboard, no scene, no text, no UI. The reference may show multiple figures; output exactly one.

Character variants: a Gondor-inspired knight in dark silver mail and a closed helmet, black cloak and silver tree heraldry, sword pointing down; a red-haired female woodland archer with pointed ears, bow, quiver and dark green leather; one sturdy gray-olive orc warrior with crude dark armor, a heavy brow and tusks, holding an axe peacefully; a Gimli-inspired dwarf with a braided reddish-brown beard, engraved helmet, leather, chainmail and axe.

The UI uses names and race-specific dialogue separately from the generated artwork. The white inner response surface provides reading contrast against the green dialogue shell. Character hover movement respects reduced-motion preferences.
