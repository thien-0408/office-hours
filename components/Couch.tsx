"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Name of the fabric material inside couch.glb (the body/cushions — the legs
// use a separate "Black" material we leave alone).
const FABRIC_MATERIAL_NAME = "Couch_Blue";

interface Couch3DProps {
  /** Hex color (e.g. "#1d3b98") applied to the couch fabric. Omit to keep the model's baked-in color. */
  color?: string;
}

export default function Couch3D({ color }: Couch3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fabricMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Clear previous renders (prevents duplicate canvases in React Strict Mode)
    container.innerHTML = "";

    // 1. Setup Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2.5, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Add Lighting
    const ambientLight = new THREE.AmbientLight("#ffffff", 1.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight("#3b82f6", 2.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Interactive orbit: drag to rotate, scroll to zoom, no panning
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI / 1.7;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;

    // 3. Load 3D Model from /public/models/couch.glb
    let couchModel: THREE.Group | null = null;
    const loader = new GLTFLoader();

    loader.load("/models/couch.glb", (gltf) => {
      couchModel = gltf.scene;
      scene.add(couchModel);

      couchModel.traverse((child) => {
        if (
          child instanceof THREE.Mesh &&
          child.material instanceof THREE.MeshStandardMaterial &&
          child.material.name === FABRIC_MATERIAL_NAME
        ) {
          fabricMaterialRef.current = child.material;
          if (color) fabricMaterialRef.current.color.set(color);
        }
      });

      // Fit the camera to the model's actual bounding box so it stays fully
      // in frame — with margin — at any rotation, instead of relying on a
      // guessed scale/position that can clip against the viewport.
      const box = new THREE.Box3().setFromObject(couchModel);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      couchModel.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = (camera.fov * Math.PI) / 180;
      const fitHeightDistance = maxDim / (2 * Math.tan(fov / 2));
      const fitWidthDistance = fitHeightDistance / camera.aspect;
      const distance = Math.max(fitHeightDistance, fitWidthDistance) * 1.4;

      camera.position.set(0, maxDim * 0.15, distance);
      camera.near = distance / 100;
      camera.far = distance * 100;
      camera.updateProjectionMatrix();

      controls.target.set(0, 0, 0);
      controls.minDistance = distance * 0.6;
      controls.maxDistance = distance * 1.5;
      controls.update();
    });

    // Pause auto-rotate while the user is dragging
    controls.addEventListener("start", () => {
      controls.autoRotate = false;
    });

    // 4. Render & Animation Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      controls.dispose();
      renderer.dispose();
      container.innerHTML = "";
      fabricMaterialRef.current = null;
    };
    // Mounts the scene once; the effect below handles color changes without rebuilding it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recolor the fabric in place whenever `color` changes (model may still be loading).
  useEffect(() => {
    if (color && fabricMaterialRef.current) {
      fabricMaterialRef.current.color.set(color);
    }
  }, [color]);

  return <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
}