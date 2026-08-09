"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { useReducedMotion } from "framer-motion";

// Hero-only WebGL scene (docs/DESIGN.md §1.1 — 3D/hand-drawn accents are
// landing-only, never the app shell). A bowed "calendar wall" of office-hours
// slot tiles, arced so its two ends sit forward in the gutters and its middle
// recedes into fog behind the hero's text/card columns — a designed
// silhouette, not a scatter of random boxes. Tilts gently toward the cursor,
// recedes/fades as the hero scrolls out of view (which doubles as the
// off-screen render-pause), and sits inert on a single static frame under
// prefers-reduced-motion. Raw three.js (no @react-three/fiber/drei), matching
// the only other precedent for 3D in this codebase.

const DAYS = 7;
const SLOTS_PER_DAY = 5;
const MOBILE_DAYS = 4;
const MOBILE_SLOTS_PER_DAY = 2;
const MOBILE_BREAKPOINT_PX = 768; // Tailwind `md`, matches app/page.tsx's max-md: usage

type SlotStatus = "OPEN" | "BOOKED" | "PENDING";

// Deterministic per-tile hash -> [0,1) — a designed, reproducible arrangement
// rather than Math.random() scatter (the thing being fixed here).
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export default function SchedulingHeroBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Prevent duplicate canvas creation in React Strict Mode
    container.innerHTML = "";

    const isMobile = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`).matches;
    const days: number = isMobile ? MOBILE_DAYS : DAYS;
    const slotsPerDay: number = isMobile ? MOBILE_SLOTS_PER_DAY : SLOTS_PER_DAY;

    // 1. Scene & Camera
    // Fog + camera distance together decide how much color survives to the
    // screen: FogExp2's blend is 1-exp(-(density*distance)^2), so at the old
    // density (0.055) and camera distance (18), the *nearest* tiles were
    // already ~62% blended into the background before any recede logic ran
    // — the whole cluster read as pale gray regardless of status/lighting.
    // Camera pulled in and density cut so the front tiles hold real color at
    // rest; the far/receded tiles still fog out, and full scroll-recede (see
    // the animate loop) still pushes density high enough to dissolve everyone.
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f6f8fc"); // --paper-50
    const baseFogDensity = isMobile ? 0.02 : 0.022;
    scene.fog = new THREE.FogExp2("#f6f8fc", baseFogDensity);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 15);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    container.appendChild(renderer.domElement);

    // 3. Lights — a real key/fill/rim rig instead of one ambient + one point
    // light, so the rounded tiles model form instead of reading flat/shadeless.
    // Intensities pushed up from the first pass, which was too subtle to read
    // once combined with MeshStandardMaterial's light-dependent shading.
    const hemiLight = new THREE.HemisphereLight("#f6f8fc", "#7a93d6", 0.7);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight("#ffffff", 1.9);
    keyLight.position.set(-8, 10, 12);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight("#5c8af0", 1.4); // --brand-400
    rimLight.position.set(10, -4, -8);
    scene.add(rimLight);

    const accentLight = new THREE.PointLight("#3465e0", 3, 40); // --brand-500
    accentLight.position.set(9, 6, 6);
    scene.add(accentLight);

    // 4. Geometry & shared materials (one set per status, not per-mesh) — a
    // rounded box catches the rim light along its edges instead of relying
    // solely on the EdgesGeometry overlay for definition. Slightly larger
    // than the first pass so the rounded corners actually resolve at hero
    // scale, and given a small emissive tint so each tile keeps a legible
    // brand-blue hue even face-on to the lights, rather than depending
    // entirely on light angle for any color to survive.
    const geometry = new RoundedBoxGeometry(1.75, 1.1, 0.2, 3, 0.1);
    const edgeGeometry = new THREE.EdgesGeometry(geometry);

    // Mobile has no side gutter to hide in (single-column, full-width text
    // and nav) — rather than chase a perfectly clear zone, the cluster is
    // pushed mostly off the top edge (see baseGroupY below) and dimmed
    // further so whatever sliver does overlap the nav/eyebrow reads as
    // faint texture, not a solid block competing with real chrome.
    const opacityScale = isMobile ? 0.35 : 1;
    const BASE_OPACITY = {
      booked: 0.85 * opacityScale,
      open: 0.4 * opacityScale,
      pending: 0.75 * opacityScale,
    };
    const bookedMaterial = new THREE.MeshStandardMaterial({
      color: "#3465e0", // --brand-500
      emissive: "#1d3b98", // --brand-700, keeps booked tiles reading as saturated blue
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: BASE_OPACITY.booked,
      roughness: 0.3,
      metalness: 0,
    });
    const openMaterial = new THREE.MeshStandardMaterial({
      color: "#8fb0ff", // --brand-300 — a step more saturated than the first pass's brand-200
      emissive: "#3465e0", // --brand-500
      emissiveIntensity: 0.12,
      transparent: true,
      opacity: BASE_OPACITY.open,
      roughness: 0.45,
      metalness: 0,
    });
    const pendingMaterial = new THREE.LineBasicMaterial({
      color: "#5c8af0", // --brand-400
      transparent: true,
      opacity: BASE_OPACITY.pending,
    });

    // 5. Build the bowed "calendar wall": deterministic per-(day, slot)
    // position along a shallow arc (arc endpoints forward in the gutters,
    // arc midpoint receding into fog behind the text/card columns), with a
    // small seeded per-tile jitter — designed shape, not scattered noise.
    const slotsGroup = new THREE.Group();
    // Tighter than the first pass — that spacing put the arc's left end
    // directly over the headline/paragraph text (world x roughly -11 to 1 is
    // the text's footprint at this camera distance). A narrower, tighter
    // cluster shifted further right (see slotsGroup.position below) keeps
    // the whole thing in the top band and the right gutter/around the card.
    const spacingX = isMobile ? 1.4 : 2.0;
    // Mobile stacks the headline above the card (single column, full-width
    // text) — there's no side gutter to hide in like desktop's two-column
    // layout has, so the cluster's only clear zone is a thin band above the
    // headline. Tight vertical spacing keeps that band thin.
    const spacingY = isMobile ? 0.7 : 1.9;
    const arcDepth = isMobile ? 3 : 5;

    const tiles: {
      mesh: THREE.Mesh | THREE.LineSegments;
      baseX: number;
      baseY: number;
      baseZ: number;
      phase: number;
      bobAmount: number;
      rotSpeed: number;
    }[] = [];

    for (let day = 0; day < days; day++) {
      const t = days === 1 ? 0.5 : day / (days - 1); // 0..1 across the week
      const arcZ = -Math.sin(t * Math.PI) * arcDepth; // 0 at the ends (forward), deepest at the middle (receding)
      const distanceFromCenter = Math.abs(t - 0.5) * 2; // 1 at the ends, 0 at the middle

      for (let slot = 0; slot < slotsPerDay; slot++) {
        const seed = day * 100 + slot;
        const baseX = (day - (days - 1) / 2) * spacingX + (seededRandom(seed) - 0.5) * 0.5;
        const baseY = ((slotsPerDay - 1) / 2 - slot) * spacingY + (seededRandom(seed + 1) - 0.5) * 0.4;
        const baseZ = arcZ + (seededRandom(seed + 2) - 0.5) * 1.1;

        // Status follows depth, not chance: forward tiles read as booked
        // (opaque brand), the receding middle reads as open (faint,
        // fog-dissolved), and pending wireframes sprinkle the far edges.
        let status: SlotStatus;
        if (distanceFromCenter > 0.62) {
          status = seededRandom(seed + 3) < 0.18 ? "PENDING" : "BOOKED";
        } else if (distanceFromCenter < 0.28 && seededRandom(seed + 4) < 0.22) {
          status = "PENDING";
        } else {
          status = "OPEN";
        }

        let mesh: THREE.Mesh | THREE.LineSegments;
        if (status === "PENDING") {
          mesh = new THREE.LineSegments(edgeGeometry, pendingMaterial);
        } else {
          mesh = new THREE.Mesh(geometry, status === "BOOKED" ? bookedMaterial : openMaterial);
        }

        mesh.position.set(baseX, baseY, baseZ);
        mesh.rotation.set(
          seededRandom(seed + 5) * 0.35,
          seededRandom(seed + 6) * 0.35,
          seededRandom(seed + 7) * 0.15
        );

        slotsGroup.add(mesh);
        tiles.push({
          mesh,
          baseX,
          baseY,
          baseZ,
          phase: seededRandom(seed + 8) * Math.PI * 2,
          bobAmount: 0.22 + seededRandom(seed + 9) * 0.18,
          rotSpeed: (seededRandom(seed + 10) - 0.5) * 0.006,
        });
      }
    }

    // Bias the whole cluster up and toward the outer gutter, and tilt it to a
    // three-quarter angle so it reads as one designed object, not a flat
    // grid staring straight at the camera. Base rotation is preserved as the
    // pivot cursor-tilt eases around (see the animate loop).
    const baseYaw = isMobile ? -0.08 : -0.32;
    const basePitch = isMobile ? 0.03 : 0.11;
    const baseGroupZ = -1; // pulled forward from the first pass's -2 — closer to the (now nearer) camera so fog doesn't pre-wash the front row
    const baseGroupX = isMobile ? 0 : 6.8; // mobile is single-column full-width text, so there's no horizontal gutter to bias toward; desktop shifts right, clear of the text column
    const baseGroupY = isMobile ? 9.3 : 4.3; // mobile: pushed mostly above the frustum's top edge, leaving only a faint sliver over the nav row (well clear of the eyebrow ~138px down and headline ~176px down); desktop: clear of the paragraph line
    slotsGroup.rotation.set(basePitch, baseYaw, 0);
    slotsGroup.position.set(baseGroupX, baseGroupY, baseGroupZ);
    scene.add(slotsGroup);

    // 6. Reduced motion: render one static frame and stop — no listeners,
    // no rAF, composition and lighting stay exactly as designed above.
    if (prefersReducedMotion) {
      renderer.render(scene, camera);
      return () => {
        bookedMaterial.dispose();
        openMaterial.dispose();
        pendingMaterial.dispose();
        geometry.dispose();
        edgeGeometry.dispose();
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    }

    // 7. Cursor tilt (group orbits gently toward the pointer, small camera
    // parallax) — damped, frame-rate independent, deliberately small since
    // this sits behind real UI the user needs to read and click.
    let pointerX = 0;
    let pointerY = 0;
    const YAW_CAP = 0.12;
    const PITCH_CAP = 0.08;

    function handleMouseMove(e: MouseEvent) {
      pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      pointerY = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    if (!isMobile) window.addEventListener("mousemove", handleMouseMove);

    // 8. Scroll recede + off-screen pause, sharing one mechanism: an
    // IntersectionObserver gates whether the render loop runs at all; while
    // it runs, the hero's own bounding rect (read once per frame, no extra
    // scroll listener) drives how far the cluster has receded/faded.
    let isVisible = true;
    let isTabVisible = document.visibilityState === "visible";
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && isTabVisible) startLoop();
      },
      { threshold: 0 }
    );
    io.observe(container);

    function handleVisibilityChange() {
      isTabVisible = document.visibilityState === "visible";
      if (isTabVisible && isVisible) startLoop();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const clock = new THREE.Clock();
    let animationFrameId: number | null = null;

    function frame() {
      animationFrameId = null;
      if (!isVisible || !isTabVisible) return;

      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Scroll progress: 0 while the hero is fully at/below the top of the
      // viewport, 1 once it's scrolled fully past — drives the recede/fade.
      const rect = container.getBoundingClientRect();
      const progress = rect.height > 0 ? Math.min(1, Math.max(0, -rect.top / rect.height)) : 0;

      tiles.forEach((tile) => {
        tile.mesh.position.y = tile.baseY + Math.sin(elapsed + tile.phase) * tile.bobAmount;
        tile.mesh.rotation.y += tile.rotSpeed;
      });

      const targetYaw = baseYaw + pointerX * YAW_CAP;
      const targetPitch = basePitch + pointerY * PITCH_CAP;
      slotsGroup.rotation.y = THREE.MathUtils.damp(slotsGroup.rotation.y, targetYaw, 3.5, dt);
      slotsGroup.rotation.x = THREE.MathUtils.damp(slotsGroup.rotation.x, targetPitch, 3.5, dt);

      camera.position.x = THREE.MathUtils.damp(camera.position.x, pointerX * 1.1, 4, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, pointerY * 1.1, 4, dt);
      camera.lookAt(0, 0, 0);

      // Recede + fade as the hero scrolls out of view. The fog-density delta
      // is the dominant fade mechanism (FogExp2 scales with distance
      // squared, so a modest density increase over a modest z-recede
      // dissolves the cluster fast); opacity fade is a secondary assist.
      slotsGroup.position.z = baseGroupZ - progress * 7;
      slotsGroup.position.y = baseGroupY + progress * 3.5;
      bookedMaterial.opacity = BASE_OPACITY.booked * (1 - progress * 0.7);
      openMaterial.opacity = BASE_OPACITY.open * (1 - progress * 0.7);
      pendingMaterial.opacity = BASE_OPACITY.pending * (1 - progress * 0.7);
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.density = baseFogDensity + progress * progress * 0.09;
      }

      accentLight.position.x = 9 + pointerX * 3;
      accentLight.position.y = 6 + pointerY * 3;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(frame);
    }

    function startLoop() {
      if (animationFrameId === null) {
        clock.getDelta(); // discard the paused-time gap so dt doesn't jump
        animationFrameId = requestAnimationFrame(frame);
      }
    }

    startLoop();

    // 9. Resize
    function handleResize() {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }
    window.addEventListener("resize", handleResize);

    // 10. Cleanup
    return () => {
      if (!isMobile) window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      io.disconnect();
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      bookedMaterial.dispose();
      openMaterial.dispose();
      pendingMaterial.dispose();
      geometry.dispose();
      edgeGeometry.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
    />
  );
}
