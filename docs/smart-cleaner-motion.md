# Smart Cleaner scrolling and motion

The presentation keeps native page scrolling. The live phone screens consume wheel input only
while their own state can scroll; at an edge, the page forwards the wheel to the first scrollable
ancestor outside the phone. Forwarded pixel, line, and page deltas retain their units.

## Rendering rules

- `ScrollScenes` reads every scene box before writing progress or calling screen updates. Progress
  is rounded to four decimals. Intersection observers suppress intermediate offscreen updates,
  but endpoint updates remain enabled for fast jumps and reverse scrolling. Resize observers
  schedule fresh measurements when scene dimensions change.
- Pixels retain their latest pose and dimensions while offscreen or while the document is hidden.
  WebGL and CSS3D render once when a dirty phone becomes visible. Repeating a settled pose or an
  unchanged size does not redraw. Device pixel ratio is capped at 1.5 below 900px, and 2 otherwise.
- Quick Clean scan progress updates in thousandths. Storage ring fill updates in percentage points;
  size is observed separately, and category changes also invalidate the ring.
- Floating hero pieces pause outside the viewport. Normal-flow principle reveals use feature-detected
  CSS view timelines, with fully visible content as the unsupported-browser fallback.
- 3D creation remains all-or-nothing. Lazy per-phone creation is deliberately deferred: it requires
  moving attached screens back into flat frames if a later phone fails. Do not remove rollback to
  achieve deferred loading. Decoder failure now releases the renderer allocated by that attempt.

## Presentation

Pinned scene heights are 200vh (introduction), 260vh (Quick Clean), 240vh (gallery), and 210vh
(storage). Below 900px the phone shares its viewport with copy. Gallery explanations remain visible.
At viewport heights of 680px or less, scenes use normal flow so text can grow instead of clipping.
Reduced motion uses settled, flat phones in normal flow, without decorative animation or transitions.
The chapter rail appears at widths of at least 1400px and supports keyboard activation and focus
transfer to the destination heading.

## Verification and performance recording

Unit tests cover batched reads, endpoint jumps in both directions, update deduplication, wheel
handoff, deferred phone draws, settled redraw suppression, decoder failure cleanup, and atomic
creation rollback. Rendering tests mock WebGL and CSS3D; they do not establish GPU performance.

Before making frame-rate claims, compare the parent commit and this branch using production builds
on the same desktop and a representative midrange Android phone:

1. Record a cold load and a full continuous scroll in Chrome DevTools Performance.
2. Reverse direction repeatedly at each scene boundary, then jump between chapters.
3. Scroll live phones to both edges with a mouse and trackpad. Test touch scrolling separately.
4. Resize and rotate, then check 320px reflow, 200% zoom, and reduced motion.
5. Confirm the flat fallback when WebGL or model loading fails, and navigate away during loading.
6. Compare long animation frames, layout time, GPU workload, and frame pacing. Aim for consistent
   16.7ms frames on a 60Hz display, rather than relying on an average FPS number.

Actual browser layout checks and device traces remain necessary. The automated suite and production
build alone cannot verify visual composition, touch behavior, or a frame-rate improvement.
