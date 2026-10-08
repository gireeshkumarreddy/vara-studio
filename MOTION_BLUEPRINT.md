# Reference motion blueprint

Source: `WhatsApp Video 2026-10-06 at 4.52.39 PM.mp4`, 704 × 480, 60 fps, duration 26.583333 seconds. The footage shows a monitor recorded by another camera with social-video overlays. Those surrounding elements are not part of the website and have not been reproduced.

Inspected the complete recording using sequential half-second frames, with larger one-second frames from the changing scenes. Times below are approximate.

| Reference interval | Observed structure and motion | VĀRA adaptation |
| --- | --- | --- |
| 0–7.5 s | White field; tiny centered navigation; sparse corner letterforms; 11–13 visible narrow portrait cards across an eye-shaped perspective ribbon. The band shifts horizontally and changes curvature. | White opening with small navigation, corner letterforms and 13 saree portraits at differing perspective scales. Slow drift, pointer drag, arrow keys, product selection. |
| 7.5–10.8 s | A selected portrait leaves the ribbon, enlarges and becomes the dominant left photo. Smaller images and a compact caption sit on the right. Portraits move vertically at different rates as scrolling continues. | Crimson card expands into a large left portrait with fabric detail and collection copy to the right. The next indigo spread keeps an asymmetric large/small composition and offset parallax. |
| 10.8–14.4 s | A medium portrait is isolated in a large white field with corner registration marks and side labels. A new photograph slides over it vertically. | Central cotton portrait with white/very pale sage space and four corner marks. A second portrait is uncovered from bottom to top by a scroll-linked mask. |
| 14.4–16.0 s | The centered photograph expands toward the left; a supporting image and compact description appear at the right. | The cotton portrait expands and shifts left; an ivory supporting image and copy enter on the right. |
| 16.0–18.7 s | Full-screen red editorial imagery. Large central ABOUT letters separate toward opposite edges, revealing a short central statement. | Full-screen crimson saree image, gentle image scale, ALWAYS / yours typography separating toward the corners, then occasion copy and bridal CTA. |
| 18.7–19.9 s | Quiet light section with a large multi-part title spread across the width and sparse small copy. | The feeling / The fabric / The forever title reveal and two short brand statements. |
| 19.9–21.6 s | Small white-framed portraits scattered in a large field, rising at different depths. | Eight framed saree portraits move vertically at different rates on a pale sage field, retaining white as the foundation. Each portrait opens its product. |
| 21.6–22.8 s | Asymmetrical editorial with one dominant left portrait and two much smaller images to the right. | Blush organza dominant left image, lavender image lower in the middle and a smaller emerald portrait at upper right. |
| 22.8–24.4 s | Edge-to-edge editorial close-up with restrained white text; full-image motion. | Edge-to-edge woven fabric detail with restrained headings and fabric parallax. |
| 24.4–25.2 s | Another large portrait left and a small companion image/caption right. | Gold occasion saree left, text and a small ivory companion image right. |
| 25.2–26.58 s | A very sparse footer with an oversized multi-line name and compact links. | Oversized VĀRA wordmark and compact collection/detail links. |

## Motion model

- Native document scroll; sticky chapters hold the original visual scenes.
- Motion values follow scroll using frame-rate-independent exponential damping (90 ms time constant).
- Each chapter has its own normalized 0–1 progress; transitions use smoothstep interpolation.
- Image ribbon uses projective matrices mapping photographs to adjacent trapezoidal panels. Its shared height envelope changes from an outward eye to an inward bend and then a flat strip. Horizontal motion and drag remain continuous through the shape change.
- Main photograph expansion, upward mask, opposing title movement and scatter-gallery movement remain distinct effects; they are not replaced by generic fades.
- Revised per the user's correction: the opening remains white, but the selected product and subsequent collections use clearly visible rose, blue, sage, blush, lavender and gold environments. Product colour spreads cover the entire viewport.
- Tablet and mobile change card widths, image positions and text proportions. Horizontal dragging leaves vertical touch scrolling available.
- Hover is limited to observed/editorially appropriate affordances: image scale and caption reveal. The recording does not establish exact original hover or menu implementation.
- Selecting a saree creates a shared-image transition: original position → central portrait → vertical layered stack → large left image with smaller right companions. The surrounding colour interpolates during this sequence over 1.2 seconds; the primary image transition lasts 1.35 seconds.

## Interaction layer (revision 3)

Added on request for a fully interactive, motion-rich site. These effects go beyond the reference recording and are additions, not reconstructions.

- `motion.js` publishes a per-frame `state` (smoothed scroll, velocity, hero progress, drag, pause, reduced motion) and an `onFrame` hook, so all motion shares one loop and one smoothed scroll value.
- `motion.js` also toggles an `in` class on the hero spread, cotton copy and bridal message when they arrive. This lets their text reveal inside the sticky scenes.
- Images reveal from cached geometry rather than IntersectionObserver, because Chrome measures a fully clipped element as zero-area.
- When inertial scrolling is active, the engine's own damping drops from 90 ms to 45 ms so the two smoothing stages do not compound.

## Revision 4

- The pastel section and product environments from revision 2 are replaced by white.
- The one colour event is the crimson drape on a fixed canvas behind the content. Its top edge rises from 0.35 viewport before the world section to 0.15 viewport after it. Its bottom edge rises over the last 0.5 viewport of the collections and 0.2 viewport beyond. Both run on smoothstep, so the silk overtakes the content.
- Ink, muted and rule colours, and the header surface, interpolate from how much of the viewport the silk covers. Dialogs reset these colours.
- Butterflies, petals and sparkles all run on the engine's frame hook and respect the pause control.

## Deliberate limits

The source does not expose its code, easing constants, responsive behavior or full commerce interactions. This is a close reconstruction of the visible choreography, with functional commerce exploration added to fit the brief. It does not claim pixel-exact recovery of hidden behavior. All shopping data is illustrative.
