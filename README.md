# VĀRA Studio

A complete static storefront concept for a Gen Z fashion label (high-end fast fashion), adapted from the provided 26.58-second fashion portfolio recording. It began as a saree house; revision 6 relaunched it as VĀRA Studio. The homepage preserves the reference's visual sequence: perspective image ribbon, expanding editorial spread, vertically layered portrait reveal, full-screen campaign with separating typography, quiet statement, scattered image archive, asymmetric editorial, fabric immersion, final product spread, and oversized wordmark footer.

## Run or deploy

Serve `dist/` with any static web server. No dependency installation or build is required. All images, fonts, styles and JavaScript are local. ES modules require HTTP serving rather than opening `index.html` using `file://`.

On a local machine: `python3 -m http.server 8080 --directory dist`

This repository holds the code only. Photographs and fonts are not committed. Before serving, add them to `dist/assets/`: `black`, `blue`, `gold`, `green`, `ivory`, `lilac`, `pink`, `red` and `weave` as `.webp`, plus `editorial.otf`, `editorial-italic.otf` and `sans.otf`. `ASSET_PROVENANCE.md` lists the photo sources.

Run `npm run check` for JavaScript syntax checks. `node scripts/verify-motion.mjs` checks that the motion engine runs with finite transforms at representative desktop/mobile scroll positions. This simulated DOM check is not a visual browser test.

## Architecture

- `dist/index.html` — semantic homepage, collection, product, bag, information and navigation dialogs.
- `dist/styles.css` — reusable editorial layout system, tablet/mobile adaptations, focus and reduced-motion rules.
- `dist/catalog.js` — eight illustrative looks and the collection taxonomy (Denim, Tailoring, Streetwear, Going out, Essentials).
- `dist/app.js` — collection/search/sort, product details, image zoom, quantity controls, wishlist and bag.
- `dist/motion.js` — reusable scroll ranges, smooth interpolation, image masks, title splitting, parallax and atmosphere interpolation.
- `dist/ribbon-geometry.js` — projective image panels sharing a curved envelope; convex eye → concave bend → flat ribbon sequence.
- `dist/denim-art.js` — the drape's textile artwork, drawn once into high-resolution tiles: indigo twill body, waistband with belt loops and leather patch, released raw hem and frayed threads.
- `dist/ornaments.js` — studio ornaments: the denim drape (canvas), confetti over the going-out edit and the holographic sparkle trail.
- `dist/interactions.js` — interaction layer driven by the engine's per-frame `state`: opening loader, inertial wheel scrolling, cursor, magnetic controls, text/image reveals, marquee, fabric loupe, footer wordmark and dialog choreography.
- `dist/assets/` — nine 1024 × 1536 WebP photographs from Unsplash (see `ASSET_PROVENANCE.md`), local fonts and font license notices.
- `saree-archive/` — the previous saree version's photographs, drape artwork and image provenance. Not used by the site.

No third-party scripts, CDNs, trackers or network calls are required by the page. Bag and wishlist persist in the visitor's own local storage. Native dialogs provide focus containment and Escape-to-close. Ambient motion has a pause control; reduced-motion preference suppresses ambient animation, parallax and entrance transitions.

Revision 2 follows the user's colour correction: opened products and collection views use visibly coloured environments rather than near-white panels. A clicked photograph moves from its actual on-screen position into a layered vertical stack and then into a full-screen, three-column editorial spread. The introductory heading has been removed from view to preserve the sparse reference composition. Four corner letters disperse during the opening, while the photographic ribbon unfolds from a thin aperture.

## Interactive motion layer

- **Loader** counts real image and font loading, cycles the collection in a small frame between the letters, then folds into the hero ribbon's aperture.
- **Inertial scrolling** smooths wheel input and anchor links on mouse/trackpad devices. Touch, keyboard and scrollbar scrolling stay native.
- **Cursor** shows VIEW, DRAG and ZOOM labels and stretches with movement. Buttons and links are magnetic, and navigation labels roll on hover.
- **Ribbon**: hovered cards lift while the rest dim, and the corner letters lean toward the pointer.
- **Reveals**: every heading reveals word by word (letter by letter for "Reposted." and product names). Copy fades up in sequence, and images unmask with an inner parallax and a slight skew from scroll speed.
- **Scroll-linked accents**: the world and craft titles breathe apart, the craft section opens from a framed aperture with a fabric loupe under the pointer, a weave marquee follows scroll speed and direction, and the footer wordmark rises letter by letter.
- **Dialogs**: the collection and menu open as curtains, the bag slides in, cards and details stagger, category tabs share a sliding indicator, and the wishlist and bag counters pop on change.
- **Accessibility**: `prefers-reduced-motion` disables all of it. The pause control also stops the marquee and ambient cues.

## Revision 6: Gen Z relaunch

The saree house became VĀRA Studio, a Gen Z high-street label with new drops every Friday. Layout, motion and interaction are unchanged; content, photography and ornaments are new.

- **Catalogue:** eight looks named like a café menu: Cherry Cola, Indigo, Matcha, Oat Milk, Bubblegum, Yuzu, Black Coffee and Ube. Each has a short `line` label for cards, a full `piece` description, material, colour, fit and an illustrative INR price. Categories are Denim, Tailoring, Streetwear, Going out and Essentials.
- **Story:** the hero reads "Dressed for *now.*". It is followed by the denim edit ("Some fits just hit. *No notes.*"), the tailoring edit, an "AFTER *hours.*" going-out campaign, the world statement ("The fit. The fabric. *The feeling.*"), the moodboard archive, a soft-launch edit, a denim craft close-up and a streetwear finale.
- **Photography:** nine free-licence Unsplash photos (studio looks plus a denim detail). Credits are in the "About this concept" panel and `ASSET_PROVENANCE.md`.
- **Denim drape:** replaces the crimson silk. The body is rigid indigo twill with rope-dyed streaks and weft slubs. The rising edge is a waistband with copper topstitching, bar-tacked belt loops, rivets and a leather VĀRA patch. The closing edge is a released hem with chain stitch, a ghost-hem line and wear fading, and loose white weft threads swing below it on spring physics. Pleat shading, a cool light wash, pointer lean and per-element ivory text are kept.
- **Ornaments:** the butterflies were removed. The petal shower became party confetti (cherry hearts, holographic sequins, chrome stars and foil strips) over the going-out campaign. The sparkle trail is now holographic, and the cursor turns copper over the denim.
- **Accessibility:** reduced motion still turns all ornaments off and shows the world section on white.

## Scope and handoff

VĀRA Studio is an invented brand concept. Photography is from Unsplash under the Unsplash License and shows styling references, not VĀRA garments. Product names, materials and prices are illustrative. Read `ASSET_PROVENANCE.md` for photographers, sources and processing.

The storefront supports exploration through product selection and bag review. It does not take payment, place orders, authenticate customers or connect real inventory. The interface explicitly discloses that purchases are not enabled. Empty subcategories are handled honestly rather than showing unrelated products.

To launch a real store: replace the illustrative catalogue with verified product data and photography of the actual garments, connect inventory and checkout, and supply real fulfilment and returns policies.

## Verification

JavaScript syntax, catalogue/asset consistency, local resource references, section anchors, unique IDs, and motion-engine runtime checks were run. Revision 6 was also checked in a browser at desktop (1578 × 923) and phone (375 × 812) widths: hero ribbon, denim and tailoring edits, going-out campaign with confetti, the denim drape rising and lifting away, shop filters and product details. Real touch gestures remain unverified.

Reference motion timings are estimates from a camera recording of a display. Scroll animation is linked to visitor progress, so real duration depends on scroll speed. Exact original easing, hover behaviors and off-screen interactions cannot be recovered from the recording alone.
