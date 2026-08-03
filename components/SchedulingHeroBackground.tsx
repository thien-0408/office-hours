"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function SchedulingHeroBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Prevent duplicate canvas creation in React Strict Mode
    container.innerHTML = "";

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f8fafc");
    scene.fog = new THREE.FogExp2("#f8fafc", 0.04);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 18);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3. Lights
    const ambientLight = new THREE.AmbientLight("#ffffff", 1.4);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight("#3b82f6", 3.5, 50);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // 4. Create 3D Floating Time Slots
    const slotsGroup = new THREE.Group();
    const count = 35;
    const geometry = new THREE.BoxGeometry(1.6, 1.0, 0.15);

    const slotInstances: {
      mesh: THREE.Mesh;
      baseY: number;
      speed: number;
      rotSpeed: number;
    }[] = [];

    for (let i = 0; i < count; i++) {
      const isHighlighted = Math.random() > 0.75;
      const material = new THREE.MeshStandardMaterial({
        color: isHighlighted ? "#2563eb" : "#bfdbfe",
        transparent: true,
        opacity: isHighlighted ? 0.6 : 0.35,
        roughness: 0.2,
        metalness: 0.1,
      });

      const mesh = new THREE.Mesh(geometry, material);
      const x = (Math.random() - 0.5) * 26;
      const y = (Math.random() - 0.5) * 16;
      const z = (Math.random() - 0.5) * 12 - 2;

      mesh.position.set(x, y, z);
      mesh.rotation.set(
        Math.random() * 0.4,
        Math.random() * 0.4,
        Math.random() * 0.2
      );

      slotsGroup.add(mesh);
      slotInstances.push({
        mesh,
        baseY: y,
        speed: 0.005 + Math.random() * 0.008,
        rotSpeed: (Math.random() - 0.5) * 0.005,
      });
    }

    scene.add(slotsGroup);

    // 5. Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 6. Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;
      slotInstances.forEach((slot, idx) => {
        slot.mesh.position.y = slot.baseY + Math.sin(time + idx) * 0.35;
        slot.mesh.rotation.y += slot.rotSpeed;
      });

      camera.position.x += (mouseX * 2.2 - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 2.2 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      pointLight.position.x = mouseX * 12;
      pointLight.position.y = mouseY * 12;

      renderer.render(scene, camera);
    };

    animate();

    // 7. Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
    />
  );
}