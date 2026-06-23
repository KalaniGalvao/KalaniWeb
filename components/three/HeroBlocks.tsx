"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollStore } from "@/lib/scroll-store";
import { heroFragmentShader, heroVertexShader } from "./wave-shaders";

const GRID_X = 40; // dense + small so the wave reads as fine and fluid
const GRID_Z = 26;
const SPACING = 0.55;
const COUNT = GRID_X * GRID_Z;

function srgb(hex: string) {
  return new THREE.Color(hex).convertSRGBToLinear();
}

function WaveField({ loopPreview = false }: { loopPreview?: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera, gl } = useThree();

  const geometry = useMemo(() => new THREE.BoxGeometry(0.5, 0.5, 0.5), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: heroVertexShader,
        fragmentShader: heroFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uScroll: { value: 0 },
          uVelocity: { value: 0 },
          uAmp: { value: 0.5 },
          uFreq: { value: 0.6 },
          uMouse: { value: new THREE.Vector2(999, 999) },
          uMouseActive: { value: 0 },
          uMouseRadius: { value: 3.0 },
          uMousePress: { value: 0.6 },
          uColorLow: { value: srgb("#0a1c54") },
          uColorHigh: { value: srgb("#2f6bff") },
          uGlow: { value: srgb("#6cd0ff") },
        },
      }),
    [],
  );

  // Lay the cubes out on the XZ plane. Cubes on the RIGHT are scaled down
  // (height and footprint) so they sit quietly behind the headline (which lands
  // on the right); they grow toward the left where there's no text — keeps the
  // copy readable over a full-bleed field.
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    let i = 0;
    for (let x = 0; x < GRID_X; x++) {
      for (let z = 0; z < GRID_Z; z++) {
        const xNorm = x / (GRID_X - 1); // 0 = far left, 1 = far right
        dummy.position.set(
          (x - (GRID_X - 1) / 2) * SPACING,
          0,
          (z - (GRID_Z - 1) / 2) * SPACING,
        );
        const variation = 0.6 + (Math.sin(x * 1.3 + z * 0.4) * 0.5 + 0.5) * 0.5;
        const heightScale = THREE.MathUtils.lerp(1.0, 0.26, xNorm) * variation;
        const footprint = THREE.MathUtils.lerp(0.92, 0.55, xNorm);
        dummy.scale.set(footprint, heightScale, footprint);
        dummy.updateMatrix();
        mesh.setMatrixAt(i++, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  // Track the pointer at the window level and project it onto the grid plane.
  // Window-level (not canvas) so the field reacts even while the cursor is over
  // the headline/buttons, and the canvas can stay pointer-events:none.
  const pointer = useRef({ x: 0, y: 0, active: 0 });
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(
    () => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    [],
  );
  const hit = useMemo(() => new THREE.Vector3(), []);
  const mouseTarget = useMemo(() => new THREE.Vector2(), []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      pointer.current.x = nx * 2 - 1;
      pointer.current.y = -(ny * 2 - 1);
      pointer.current.active =
        nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1 ? 1 : 0;
    };
    const onLeave = () => {
      pointer.current.active = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeave);
    };
  }, [gl]);

  useFrame(() => {
    const u = material.uniforms;
    // Both the real hero and the end-of-page loop bridge use absolute canvas
    // time, so their wave phase matches when the scroll position teleports.
    u.uTime.value = performance.now() / 1000;
    u.uScroll.value = loopPreview
      ? 0
      : scrollStore.scrollY / Math.max(1, window.innerHeight);
    u.uVelocity.value = THREE.MathUtils.lerp(
      u.uVelocity.value,
      loopPreview ? 0 : THREE.MathUtils.clamp(scrollStore.velocity, -6, 6),
      0.1,
    );

    // Project the cursor onto the grid plane, then ease uMouse toward it so the
    // ripple trails the pointer smoothly instead of snapping.
    ndc.set(pointer.current.x, pointer.current.y);
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.ray.intersectPlane(plane, hit)) {
      mouseTarget.set(hit.x, hit.z);
      (u.uMouse.value as THREE.Vector2).lerp(mouseTarget, 0.16);
    }
    u.uMouseActive.value = THREE.MathUtils.lerp(
      u.uMouseActive.value,
      pointer.current.active,
      0.08,
    );
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, COUNT]}
      frustumCulled={false}
    />
  );
}

/**
 * The hero's full-bleed WebGL layer. Rendered client-only (the parent
 * dynamic-imports it with ssr:false): the 3D is decorative progressive
 * enhancement, while the hero's heading/copy is server-rendered HTML for SEO.
 * The render loop pauses whenever the hero scrolls out of view (zero GPU cost
 * for the rest of the page).
 */
export default function HeroBlocks({
  loopPreview = false,
}: {
  loopPreview?: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "100px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The infinite-loop controller fires this immediately before teleporting the
  // scroll position. Waking both canvases ahead of the browser paint prevents
  // a blank WebGL frame at either side of the loop.
  useEffect(() => {
    const wakeForLoop = () => setActive(true);
    window.addEventListener("kalani:loop-handoff", wakeForLoop);
    return () => window.removeEventListener("kalani:loop-handoff", wakeForLoop);
  }, []);

  return (
    <div ref={wrapperRef} className="h-full w-full">
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 7.5, 15], fov: 44 }}
      >
        {/* Fog colour = hero background, so distant cubes dissolve into the
            page with no hard edge — part of the border-less aesthetic. */}
        <fog attach="fog" args={["#070b16", 14, 34]} />
        <WaveField loopPreview={loopPreview} />
      </Canvas>
    </div>
  );
}
