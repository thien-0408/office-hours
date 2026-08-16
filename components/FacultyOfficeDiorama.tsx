"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { useReducedMotion } from "framer-motion";

// /welcome 3D Faculty Office & Consultation Room Diorama
// Built with raw Three.js following docs/DESIGN.md.
// Theme: Room 304 — Faculty Advisor Suite (Computer Science & Academic Advising)
// Features:
// - Frosted glass office entrance door with illuminated digital status plate
// - Oak advisor desk with laptop showing dynamic HTML5 canvas timetable UI
// - Whiteboard with rendered academic algorithms, conflict graph & queue policy
// - Multi-tier bookshelf with 35+ realistic book spines & desk accessories
// - Articulated desk lamp with warm light cone & daylight window illumination
// - CatmullRom camera spline gliding through Entrance -> Laptop -> Whiteboard -> Consultation Chair

const MOBILE_BREAKPOINT_PX = 768;

// Design system colors
const COLOR_ROOM_FLOOR = "#e8edf5";
const COLOR_ROOM_WALL = "#f0f4fb";
const COLOR_WALL_PANEL = "#0b1b49"; // --brand-900
const COLOR_DESK_WOOD = "#c49a6c";
const COLOR_DESK_LEGS = "#2d3748";
const COLOR_CHAIR_NAVY = "#1d3b98"; // --brand-700
const COLOR_CHAIR_ACCENT = "#3465e0"; // --brand-500
const COLOR_LAMP_WARM = "#fff6db";

function createLaptopCanvasTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // Background
    ctx.fillStyle = "#0b1b49";
    ctx.fillRect(0, 0, 512, 320);

    // Header bar
    ctx.fillStyle = "#1d3b98";
    ctx.fillRect(0, 0, 512, 44);

    // Window controls
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(20, 22, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(38, 22, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(56, 22, 6, 0, Math.PI * 2);
    ctx.fill();

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText("OfficeHours — Dr. Amara Chen (CS Dept)", 80, 27);

    // Banner
    ctx.fillStyle = "#3465e0";
    ctx.roundRect(20, 56, 472, 38, 6);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("⚡ 100% Conflict-Free Slots · Synced with AAO Timetable", 36, 80);

    // Slot Grid
    const days = ["Mon 14:00", "Tue 09:30", "Wed 14:00", "Thu 11:00", "Fri 10:30"];
    const statuses = ["AVAILABLE", "CONFIRMED", "AVAILABLE", "WAITLIST", "AVAILABLE"];
    const colors = ["#22c55e", "#3b82f6", "#22c55e", "#f59e0b", "#22c55e"];

    days.forEach((day, idx) => {
      const y = 108 + idx * 38;
      ctx.fillStyle = "#142a6e";
      ctx.roundRect(20, y, 472, 32, 5);
      ctx.fill();

      // Time
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText(day, 36, y + 21);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px sans-serif";
      ctx.fillText("CSW 437 / Capstone Advising", 150, y + 21);

      // Badge
      ctx.fillStyle = colors[idx];
      ctx.roundRect(380, y + 6, 100, 20, 4);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(statuses[idx], 430, y + 20);
      ctx.textAlign = "left";
    });
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

function createWhiteboardCanvasTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 576;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // Whiteboard surface
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1024, 576);

    // Subtle grid pattern
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    for (let x = 0; x < 1024; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 576);
      ctx.stroke();
    }
    for (let y = 0; y < 576; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Title / Header
    ctx.fillStyle = "#0b1b49";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("CS 437 · Office Hours & Conflict Matching Architecture", 40, 56);

    // Formula & Core Logic
    ctx.fillStyle = "#2563eb";
    ctx.font = "bold 20px monospace";
    ctx.fillText("1. Conflict Condition: S_student ∩ S_faculty = ∅", 40, 110);
    ctx.fillStyle = "#1e293b";
    ctx.font = "16px sans-serif";
    ctx.fillText("   Prunes clashing teaching/lab shifts before slot discovery.", 40, 138);

    ctx.fillStyle = "#2563eb";
    ctx.font = "bold 20px monospace";
    ctx.fillText("2. Fair Allocation Policy: Priority-by-Need + FCFS Hybrid", 40, 185);
    ctx.fillStyle = "#1e293b";
    ctx.font = "16px sans-serif";
    ctx.fillText("   Score(s) = w_urgency·Need + w_wait·Time - Penalty(no_show)", 40, 213);

    // Diagram Box
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 250, 440, 260);

    ctx.fillStyle = "#3b82f6";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("AAO Timetable Sync Pipeline", 60, 280);

    // Nodes
    const nodes = [
      { text: "PDF Schedule", x: 70, y: 310, w: 140, h: 40, col: "#eff6ff", border: "#3b82f6" },
      { text: "Local Parser", x: 300, y: 310, w: 140, h: 40, col: "#f0fdf4", border: "#22c55e" },
      { text: "Busy Blocks", x: 70, y: 410, w: 140, h: 40, col: "#fef3c7", border: "#f59e0b" },
      { text: "Verified Slots", x: 300, y: 410, w: 140, h: 40, col: "#eff6ff", border: "#2563eb" },
    ];

    nodes.forEach((n) => {
      ctx.fillStyle = n.col;
      ctx.fillRect(n.x, n.y, n.w, n.h);
      ctx.strokeStyle = n.border;
      ctx.lineWidth = 2;
      ctx.strokeRect(n.x, n.y, n.w, n.h);
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText(n.text, n.x + 18, n.y + 25);
    });

    // Arrows
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    // Arrow 1
    ctx.beginPath();
    ctx.moveTo(210, 330);
    ctx.lineTo(295, 330);
    ctx.stroke();
    // Arrow 2
    ctx.beginPath();
    ctx.moveTo(370, 350);
    ctx.lineTo(370, 405);
    ctx.stroke();
    // Arrow 3
    ctx.beginPath();
    ctx.moveTo(140, 350);
    ctx.lineTo(140, 405);
    ctx.stroke();

    // Right Side: Notes & Checklist
    ctx.fillStyle = "#0b1b49";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("Academic Integrity Guarantees", 530, 280);

    const bullets = [
      "✓ Database EXCLUSION constraint locks against double-booking",
      "✓ Zero student timetable data leaves browser during sync",
      "✓ Seeded deterministic queue resolution for fairness audits",
      "✓ 07:30 AM shift boundaries mapped automatically",
    ];

    bullets.forEach((b, i) => {
      ctx.fillStyle = "#334155";
      ctx.font = "15px sans-serif";
      ctx.fillText(b, 530, 325 + i * 40);
    });
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

function createDoorPlaqueTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    // Metal plaque
    ctx.fillStyle = "#0b1b49";
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 492, 236);

    // Room number
    ctx.fillStyle = "#60a5fa";
    ctx.font = "bold 42px sans-serif";
    ctx.fillText("ROOM 304", 36, 68);

    // Faculty Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("Dr. Amara Chen", 36, 114);

    ctx.fillStyle = "#93c5fd";
    ctx.font = "18px sans-serif";
    ctx.fillText("Computer Science & Systems Advising", 36, 146);

    // Status Indicator Pill
    ctx.fillStyle = "#16a34a";
    ctx.roundRect(36, 175, 230, 44, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 17px sans-serif";
    ctx.fillText("● OFFICE HOURS ACTIVE", 52, 203);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

function smoothstep(x: number): number {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

export default function FacultyOfficeDiorama({
  trackRef,
  onProgress,
}: {
  trackRef: RefObject<HTMLDivElement | null>;
  onProgress?: (progress: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!containerRef.current || !trackRef.current) return;
    const container = containerRef.current;
    const track = trackRef.current;

    container.innerHTML = "";

    const isMobile = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`).matches;

    // 1. Scene, Camera & Background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#eef4fc");
    scene.fog = new THREE.FogExp2("#eef4fc", isMobile ? 0.024 : 0.018);

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Lighting Rig
    const hemiLight = new THREE.HemisphereLight("#edf5ff", "#c8d6eb", 1.1);
    scene.add(hemiLight);

    const keySunlight = new THREE.DirectionalLight("#fff9eb", 1.8);
    keySunlight.position.set(8, 14, 10);
    keySunlight.castShadow = true;
    keySunlight.shadow.mapSize.width = 1024;
    keySunlight.shadow.mapSize.height = 1024;
    keySunlight.shadow.bias = -0.0005;
    scene.add(keySunlight);

    const fillLight = new THREE.DirectionalLight("#dbeafe", 0.8);
    fillLight.position.set(-8, 8, -4);
    scene.add(fillLight);

    // Warm desk lamp point light
    const deskLampLight = new THREE.PointLight(COLOR_LAMP_WARM, 2.5, 5.5);
    deskLampLight.position.set(-1.1, 2.1, 0.2);
    scene.add(deskLampLight);

    // Laptop screen glow
    const laptopGlow = new THREE.PointLight("#60a5fa", 1.4, 3.2);
    laptopGlow.position.set(0.1, 1.4, 0.3);
    scene.add(laptopGlow);

    // 3. Architectural Room Shell
    // Floor
    const floorGeo = new THREE.PlaneGeometry(16, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      color: COLOR_ROOM_FLOOR,
      roughness: 0.7,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    // Back Wall
    const backWallGeo = new THREE.PlaneGeometry(16, 7);
    const backWallMat = new THREE.MeshStandardMaterial({
      color: COLOR_ROOM_WALL,
      roughness: 0.9,
    });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, 3.5, -4);
    scene.add(backWall);

    // Wainscoting lower wood panel
    const wainscotGeo = new THREE.PlaneGeometry(16, 1.3);
    const wainscotMat = new THREE.MeshStandardMaterial({
      color: COLOR_WALL_PANEL,
      roughness: 0.6,
    });
    const wainscot = new THREE.Mesh(wainscotGeo, wainscotMat);
    wainscot.position.set(0, 0.65, -3.98);
    scene.add(wainscot);

    // Side Wall (Left - Window side)
    const leftWallGeo = new THREE.PlaneGeometry(16, 7);
    const leftWall = new THREE.Mesh(leftWallGeo, backWallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-5, 3.5, 0);
    scene.add(leftWall);

    // Window Frame & Glass
    const windowFrameGeo = new THREE.BoxGeometry(0.1, 3.2, 4.4);
    const windowFrameMat = new THREE.MeshStandardMaterial({ color: "#334155", roughness: 0.5 });
    const windowFrame = new THREE.Mesh(windowFrameGeo, windowFrameMat);
    windowFrame.position.set(-4.95, 3.6, 0.4);
    scene.add(windowFrame);

    const windowGlassGeo = new THREE.PlaneGeometry(4.2, 3.0);
    const windowGlassMat = new THREE.MeshStandardMaterial({
      color: "#bfdbfe",
      emissive: "#dbeafe",
      emissiveIntensity: 0.4,
      roughness: 0.1,
      transparent: true,
      opacity: 0.6,
    });
    const windowGlass = new THREE.Mesh(windowGlassGeo, windowGlassMat);
    windowGlass.rotation.y = Math.PI / 2;
    windowGlass.position.set(-4.9, 3.6, 0.4);
    scene.add(windowGlass);

    // Side Wall (Right - Doorway side)
    const rightWallGeo = new THREE.PlaneGeometry(16, 7);
    const rightWall = new THREE.Mesh(rightWallGeo, backWallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(5, 3.5, 0);
    scene.add(rightWall);

    // Door Frame & Frosted Glass Door
    const doorFrameGeo = new THREE.BoxGeometry(0.12, 4.2, 2.2);
    const doorFrame = new THREE.Mesh(doorFrameGeo, windowFrameMat);
    doorFrame.position.set(4.94, 2.1, 2.0);
    scene.add(doorFrame);

    const doorGeo = new THREE.BoxGeometry(0.08, 4.0, 2.0);
    const doorMat = new THREE.MeshStandardMaterial({
      color: "#1e293b",
      roughness: 0.4,
    });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(4.94, 2.1, 2.0);
    scene.add(door);

    // Door Plaque with Room 304 Texture
    const plaqueTexture = createDoorPlaqueTexture();
    const plaqueGeo = new THREE.PlaneGeometry(1.1, 0.55);
    const plaqueMat = new THREE.MeshBasicMaterial({ map: plaqueTexture });
    const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaque.rotation.y = -Math.PI / 2;
    plaque.position.set(4.88, 2.7, 0.2);
    scene.add(plaque);

    // 4. Whiteboard with Academic Textures
    const wbTexture = createWhiteboardCanvasTexture();
    const wbFrameGeo = new RoundedBoxGeometry(4.2, 2.4, 0.08, 2, 0.02);
    const wbFrameMat = new THREE.MeshStandardMaterial({ color: "#94a3b8", roughness: 0.3, metalness: 0.8 });
    const wbFrame = new THREE.Mesh(wbFrameGeo, wbFrameMat);
    wbFrame.position.set(-1.2, 3.4, -3.92);
    scene.add(wbFrame);

    const wbSurfaceGeo = new THREE.PlaneGeometry(4.0, 2.2);
    const wbSurfaceMat = new THREE.MeshBasicMaterial({ map: wbTexture });
    const wbSurface = new THREE.Mesh(wbSurfaceGeo, wbSurfaceMat);
    wbSurface.position.set(-1.2, 3.4, -3.87);
    scene.add(wbSurface);

    // Whiteboard marker tray
    const trayGeo = new THREE.BoxGeometry(3.6, 0.06, 0.16);
    const tray = new THREE.Mesh(trayGeo, wbFrameMat);
    tray.position.set(-1.2, 2.17, -3.82);
    scene.add(tray);

    // 5. Bookshelf & Books
    const shelfWoodMat = new THREE.MeshStandardMaterial({ color: "#3f2e1e", roughness: 0.6 });
    const shelfGeo = new RoundedBoxGeometry(1.6, 4.4, 0.6, 2, 0.03);
    const shelf = new THREE.Mesh(shelfGeo, shelfWoodMat);
    shelf.position.set(3.4, 2.2, -3.6);
    shelf.castShadow = true;
    scene.add(shelf);

    // Books on shelves
    const bookColors = ["#1d3b98", "#3465e0", "#b45309", "#15803d", "#0f172a", "#c2410c", "#7c3aed"];
    const bookGroup = new THREE.Group();
    for (let shelfIdx = 0; shelfIdx < 4; shelfIdx++) {
      const shelfY = 0.5 + shelfIdx * 0.95;
      let startX = -0.65;
      for (let b = 0; b < 9; b++) {
        const bookW = 0.07 + (b % 3) * 0.02;
        const bookH = 0.55 + (b % 4) * 0.08;
        const bookD = 0.42;
        const bookGeo = new RoundedBoxGeometry(bookW, bookH, bookD, 2, 0.01);
        const bookMat = new THREE.MeshStandardMaterial({
          color: bookColors[(shelfIdx * 4 + b) % bookColors.length],
          roughness: 0.5,
        });
        const bookMesh = new THREE.Mesh(bookGeo, bookMat);
        bookMesh.position.set(startX + bookW / 2, shelfY + bookH / 2, 0);
        bookMesh.castShadow = true;
        bookGroup.add(bookMesh);
        startX += bookW + 0.02;
      }
    }
    bookGroup.position.set(3.4, 0.1, -3.55);
    scene.add(bookGroup);

    // Potted plant on top of shelf
    const potGeo = new THREE.CylinderGeometry(0.18, 0.13, 0.28, 12);
    const potMat = new THREE.MeshStandardMaterial({ color: "#e2e8f0", roughness: 0.3 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.set(3.4, 4.55, -3.6);
    scene.add(pot);

    const plantLeavesGeo = new THREE.SphereGeometry(0.24, 8, 8);
    const plantLeavesMat = new THREE.MeshStandardMaterial({ color: "#15803d", roughness: 0.8 });
    const plant = new THREE.Mesh(plantLeavesGeo, plantLeavesMat);
    plant.scale.set(1.2, 0.8, 1.2);
    plant.position.set(3.4, 4.8, -3.6);
    scene.add(plant);

    // 6. Advisor Desk Setup
    const deskGroup = new THREE.Group();
    // Desk Top (Oak Wood)
    const deskTopGeo = new RoundedBoxGeometry(3.2, 0.12, 1.7, 3, 0.04);
    const deskTopMat = new THREE.MeshStandardMaterial({
      color: COLOR_DESK_WOOD,
      roughness: 0.45,
      metalness: 0.05,
    });
    const deskTop = new THREE.Mesh(deskTopGeo, deskTopMat);
    deskTop.position.y = 1.15;
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    // Desk Legs (Matte Slate Metal)
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 12);
    const legMat = new THREE.MeshStandardMaterial({ color: COLOR_DESK_LEGS, roughness: 0.4, metalness: 0.8 });
    [
      [-1.4, 0.58, -0.65],
      [1.4, 0.58, -0.65],
      [-1.4, 0.58, 0.65],
      [1.4, 0.58, 0.65],
    ].forEach(([lx, ly, lz]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, ly, lz);
      leg.castShadow = true;
      deskGroup.add(leg);
    });

    // 7. Modern Laptop on Desk
    const laptopTexture = createLaptopCanvasTexture();
    const laptopBaseGeo = new RoundedBoxGeometry(0.55, 0.02, 0.38, 2, 0.01);
    const laptopBodyMat = new THREE.MeshStandardMaterial({ color: "#cbd5e1", roughness: 0.25, metalness: 0.8 });
    const laptopBase = new THREE.Mesh(laptopBaseGeo, laptopBodyMat);
    laptopBase.position.set(0.1, 1.22, 0.2);
    laptopBase.castShadow = true;
    deskGroup.add(laptopBase);

    // Screen Lid angled up
    const screenPivot = new THREE.Group();
    screenPivot.position.set(0.1, 1.23, 0.02);
    const screenLidGeo = new RoundedBoxGeometry(0.55, 0.38, 0.018, 2, 0.01);
    const screenLid = new THREE.Mesh(screenLidGeo, laptopBodyMat);
    screenLid.position.set(0, 0.19, -0.01);
    screenLid.rotation.x = -THREE.MathUtils.degToRad(108);
    screenPivot.add(screenLid);

    const screenDisplayGeo = new THREE.PlaneGeometry(0.51, 0.33);
    const screenDisplayMat = new THREE.MeshBasicMaterial({ map: laptopTexture });
    const screenDisplay = new THREE.Mesh(screenDisplayGeo, screenDisplayMat);
    screenDisplay.position.set(0, 0.19, -0.02);
    screenDisplay.rotation.x = screenLid.rotation.x;
    screenPivot.add(screenDisplay);
    deskGroup.add(screenPivot);

    // Desk Accessories
    // 1. Modern Desk Lamp
    const lampBaseGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16);
    const lampMat = new THREE.MeshStandardMaterial({ color: COLOR_CHAIR_NAVY, roughness: 0.3, metalness: 0.7 });
    const lampBase = new THREE.Mesh(lampBaseGeo, lampMat);
    lampBase.position.set(-1.1, 1.23, 0.2);
    deskGroup.add(lampBase);

    const lampArmGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.6, 8);
    const lampArm = new THREE.Mesh(lampArmGeo, lampMat);
    lampArm.position.set(-1.1, 1.55, 0.2);
    lampArm.rotation.z = THREE.MathUtils.degToRad(-15);
    deskGroup.add(lampArm);

    const lampShadeGeo = new THREE.ConeGeometry(0.16, 0.22, 16, 1, true);
    const lampShade = new THREE.Mesh(lampShadeGeo, lampMat);
    lampShade.position.set(-0.95, 1.82, 0.2);
    lampShade.rotation.z = THREE.MathUtils.degToRad(45);
    deskGroup.add(lampShade);

    // 2. University Ceramic Mug
    const mugGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.12, 16);
    const mugMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.2 });
    const mug = new THREE.Mesh(mugGeo, mugMat);
    mug.position.set(0.9, 1.27, 0.35);
    deskGroup.add(mug);

    // 3. Stack of Syllabus Papers
    const paperGeo = new RoundedBoxGeometry(0.42, 0.04, 0.32, 2, 0.01);
    const paperMat = new THREE.MeshStandardMaterial({ color: "#f8fafc", roughness: 0.8 });
    const papers = new THREE.Mesh(paperGeo, paperMat);
    papers.position.set(-0.6, 1.23, 0.3);
    papers.rotation.y = THREE.MathUtils.degToRad(8);
    deskGroup.add(papers);

    deskGroup.position.set(-0.2, 0, -0.6);
    scene.add(deskGroup);

    // 8. Chairs
    // Professor's Executive Chair (Behind desk)
    const profChairGroup = new THREE.Group();
    const seatGeo = new RoundedBoxGeometry(0.8, 0.12, 0.7, 3, 0.04);
    const seatMat = new THREE.MeshStandardMaterial({ color: COLOR_CHAIR_NAVY, roughness: 0.5 });
    const profSeat = new THREE.Mesh(seatGeo, seatMat);
    profSeat.position.y = 0.85;
    profChairGroup.add(profSeat);

    const backGeo = new RoundedBoxGeometry(0.75, 0.9, 0.1, 3, 0.04);
    const profBack = new THREE.Mesh(backGeo, seatMat);
    profBack.position.set(0, 1.35, -0.32);
    profBack.rotation.x = THREE.MathUtils.degToRad(-6);
    profChairGroup.add(profBack);

    const profStemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 12);
    const chromeMat = new THREE.MeshStandardMaterial({ color: "#e2e8f0", roughness: 0.2, metalness: 0.9 });
    const profStem = new THREE.Mesh(profStemGeo, chromeMat);
    profStem.position.y = 0.45;
    profChairGroup.add(profStem);

    profChairGroup.position.set(-0.2, 0, -1.8);
    profChairGroup.rotation.y = THREE.MathUtils.degToRad(6);
    scene.add(profChairGroup);

    // Student Consultation Chair (In front of desk)
    const studentChairGroup = new THREE.Group();
    const sSeatGeo = new RoundedBoxGeometry(0.65, 0.08, 0.6, 2, 0.03);
    const sSeatMat = new THREE.MeshStandardMaterial({ color: COLOR_CHAIR_ACCENT, roughness: 0.4 });
    const sSeat = new THREE.Mesh(sSeatGeo, sSeatMat);
    sSeat.position.y = 0.78;
    studentChairGroup.add(sSeat);

    const sBackGeo = new RoundedBoxGeometry(0.6, 0.6, 0.06, 2, 0.02);
    const sBack = new THREE.Mesh(sBackGeo, sSeatMat);
    sBack.position.set(0, 1.12, 0.28);
    sBack.rotation.x = THREE.MathUtils.degToRad(8);
    studentChairGroup.add(sBack);

    [
      [-0.26, 0.38, -0.22],
      [0.26, 0.38, -0.22],
      [-0.26, 0.38, 0.22],
      [0.26, 0.38, 0.22],
    ].forEach(([cx, cy, cz]) => {
      const cLeg = new THREE.Mesh(legGeo, legMat);
      cLeg.scale.set(0.7, 0.7, 0.7);
      cLeg.position.set(cx, cy, cz);
      studentChairGroup.add(cLeg);
    });

    studentChairGroup.position.set(-0.1, 0, 0.85);
    studentChairGroup.rotation.y = THREE.MathUtils.degToRad(175);
    scene.add(studentChairGroup);

    // 9. Camera Spline & Waypoints
    // Waypoint 0: Entrance view of the academic office
    // Waypoint 1: Glide down to the advisor's laptop displaying conflict-free schedule
    // Waypoint 2: Pivot toward the whiteboard & fairness policy formulas
    // Waypoint 3: Settle into the student consultation chair ready to book
    const waypoints = [
      new THREE.Vector3(3.6, 3.2, 4.8),  // Waypoint 0 (Entrance)
      new THREE.Vector3(0.5, 2.0, 1.9),  // Waypoint 1 (Laptop & desk)
      new THREE.Vector3(-1.9, 2.6, 1.8), // Waypoint 2 (Whiteboard)
      new THREE.Vector3(-0.1, 1.7, 1.6), // Waypoint 3 (Consultation view)
    ];
    const cameraCurve = new THREE.CatmullRomCurve3(waypoints, false, "catmullrom", 0.3);

    const lookTargets = [
      new THREE.Vector3(-0.2, 1.6, -0.5),
      new THREE.Vector3(-0.1, 1.25, 0.2),
      new THREE.Vector3(-1.2, 3.2, -3.8),
      new THREE.Vector3(-0.2, 1.4, -1.2),
    ];

    let dampedProgress = 0;

    function renderStaticEntranceFrame() {
      const p = cameraCurve.getPointAt(0);
      camera.position.copy(p);
      camera.lookAt(lookTargets[0]);
      renderer.render(scene, camera);
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width <= 0 || height <= 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (prefersReducedMotion) renderStaticEntranceFrame();
    });
    resizeObserver.observe(container);

    if (prefersReducedMotion) {
      renderStaticEntranceFrame();
      onProgress?.(0);
      return () => {
        resizeObserver.disconnect();
        disposeAll();
      };
    }

    // 10. Mouse Parallax
    let pointerX = 0;
    let pointerY = 0;
    function handleMouseMove(e: MouseEvent) {
      pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      pointerY = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    if (!isMobile) window.addEventListener("mousemove", handleMouseMove);

    // 11. Render Loop & Visibility Gating
    let isVisible = true;
    let isTabVisible = document.visibilityState === "visible";
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && isTabVisible) startLoop();
      },
      { threshold: 0 }
    );
    io.observe(track);

    function handleVisibilityChange() {
      isTabVisible = document.visibilityState === "visible";
      if (isTabVisible && isVisible) startLoop();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const clock = new THREE.Clock();
    let animationFrameId: number | null = null;
    const currentLook = new THREE.Vector3();

    function frame() {
      animationFrameId = null;
      if (!isVisible || !isTabVisible) return;

      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      const rect = track.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const rawProgress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
      dampedProgress = THREE.MathUtils.damp(dampedProgress, rawProgress, 4.2, dt);
      const eased = smoothstep(dampedProgress);

      const basePos = cameraCurve.getPointAt(eased);
      const parallaxX = isMobile ? 0 : pointerX * 0.4;
      const parallaxY = isMobile ? 0 : pointerY * 0.25;
      camera.position.set(basePos.x + parallaxX, basePos.y + parallaxY, basePos.z);

      // Interpolate lookTarget across the 4 segments
      const segmentCount = lookTargets.length - 1;
      const segmentIndex = Math.min(segmentCount - 1, Math.floor(eased * segmentCount));
      const segmentT = (eased * segmentCount) - segmentIndex;
      currentLook.lerpVectors(lookTargets[segmentIndex], lookTargets[segmentIndex + 1], smoothstep(segmentT));
      camera.lookAt(currentLook);

      // Subtle ambient lights pulsing
      deskLampLight.intensity = 2.4 + Math.sin(elapsed * 1.5) * 0.15;
      laptopGlow.intensity = 1.3 + Math.sin(elapsed * 2.0) * 0.2;

      renderer.render(scene, camera);
      onProgress?.(rawProgress);
      animationFrameId = requestAnimationFrame(frame);
    }

    function startLoop() {
      if (animationFrameId === null) {
        clock.getDelta();
        animationFrameId = requestAnimationFrame(frame);
      }
    }
    startLoop();

    function disposeAll() {
      plaqueTexture.dispose();
      wbTexture.dispose();
      laptopTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    }

    return () => {
      if (!isMobile) window.removeEventListener("mousemove", handleMouseMove);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      io.disconnect();
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      disposeAll();
    };
  }, [prefersReducedMotion, trackRef, onProgress]);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
}
