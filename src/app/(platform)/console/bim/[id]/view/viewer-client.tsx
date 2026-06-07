"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { IFCLoader } from "web-ifc-three";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Minimal IFC 3D viewer (gap G-006 / B8 runtime).
 *
 * Built on the canonical web-ifc + three.js stack — web-ifc is the
 * MIT-licensed WASM IFC parser that powers IFC.js / @thatopen
 * components. We use it directly (no extra UI wrapper) to keep the
 * bundle lean: only the modules we render get pulled.
 *
 * The bundle is heavy (~3 MB JS + ~3 MB WASM). next/dynamic + ssr:false
 * in viewer-loader.tsx keeps it off other routes.
 *
 * For RVT / NWD: this component refuses to load anything but IFC. The
 * Autodesk Forge code path is a separate viewer (different SDK,
 * commercial-license-gated).
 */

type Props = {
  modelId: string;
  ifcUrl: string;
};

export default function ViewerClient({ modelId, ifcUrl }: Props) {
  const t = useT();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [status, setStatus] = useState<string>(t("console.bim.view.status.initializing", undefined, "Initializing…"));
  const [elementCount, setElementCount] = useState<number | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 600;

    // ── Scene ──────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f6f6);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const grid = new THREE.GridHelper(50, 50, 0xcccccc, 0xeeeeee);
    scene.add(grid);
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(50, 100, 50);
    scene.add(dir);

    // ── Pointer-driven orbit (minimal — full OrbitControls is its own
    // module, we keep this lean for the scaffold).
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    const target = new THREE.Vector3();
    const radius = { value: camera.position.distanceTo(target) };
    const polar = { value: Math.PI / 3 };
    const azimuth = { value: Math.PI / 4 };

    function updateCamera() {
      const r = radius.value;
      camera.position.x = target.x + r * Math.sin(polar.value) * Math.cos(azimuth.value);
      camera.position.y = target.y + r * Math.cos(polar.value);
      camera.position.z = target.z + r * Math.sin(polar.value) * Math.sin(azimuth.value);
      camera.lookAt(target);
    }

    function onPointerDown(e: PointerEvent) {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    }
    function onPointerMove(e: PointerEvent) {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      azimuth.value -= dx * 0.005;
      polar.value = Math.max(0.05, Math.min(Math.PI - 0.05, polar.value - dy * 0.005));
      updateCamera();
    }
    function onPointerUp(e: PointerEvent) {
      isDragging = false;
      renderer.domElement.releasePointerCapture(e.pointerId);
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      radius.value = Math.max(2, Math.min(500, radius.value * (1 + Math.sign(e.deltaY) * 0.1)));
      updateCamera();
    }

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    // ── IFC load ───────────────────────────────────────────────────────
    const ifcLoader = new IFCLoader();
    // web-ifc ships its WASM as a separate asset. We point the loader at
    // the wasm files shipped by the package; vendoring keeps the bundle
    // self-contained.
    ifcLoader.ifcManager.setWasmPath("/wasm/");

    setStatus(t("console.bim.view.status.downloading", undefined, "Downloading IFC…"));
    ifcLoader.load(
      ifcUrl,
      (model) => {
        setStatus(t("console.bim.view.status.rendering", undefined, "Rendering…"));
        scene.add(model);

        // Re-center camera on the loaded model.
        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);
        target.copy(center);
        radius.value = Math.max(size.length() * 1.2, 5);
        updateCamera();

        // Count elements — IFCLoader builds a single mesh per ifc type,
        // so we walk children for a rough total.
        let count = 0;
        model.traverse((c) => {
          if ((c as THREE.Mesh).isMesh) count += 1;
        });
        setElementCount(count);
        setStatus(t("console.bim.view.status.ready", undefined, "Ready"));
      },
      undefined,
      (err) => {
        setStatus(
          t(
            "console.bim.view.status.failed",
            { message: err instanceof Error ? err.message : String(err) },
            `Failed: ${err instanceof Error ? err.message : String(err)}`,
          ),
        );
      },
    );

    // ── Render loop ────────────────────────────────────────────────────
    let raf = 0;
    function tick() {
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }
    tick();

    // ── Resize ─────────────────────────────────────────────────────────
    function onResize() {
      const w = mount!.clientWidth || width;
      const h = mount!.clientHeight || height;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [ifcUrl]);

  return (
    <div className="space-y-2">
      <div className="surface flex items-center gap-3 p-2 text-xs">
        <span className="font-mono text-[var(--p-text-2)] uppercase">
          {t("console.bim.view.statusLabel", undefined, "Status")}
        </span>
        <span>{status}</span>
        {elementCount != null && (
          <span className="ms-auto font-mono text-[var(--p-text-2)]">
            {t("console.bim.view.meshesCount", { count: elementCount }, `${elementCount} meshes`)}
          </span>
        )}
        <span className="font-mono text-[10px] text-[var(--p-text-2)]">
          {t("console.bim.view.modelLabel", { id: modelId.slice(0, 8) }, `model ${modelId.slice(0, 8)}…`)}
        </span>
      </div>
      <div
        ref={mountRef}
        className="surface relative"
        style={{ height: "75vh", touchAction: "none" }}
        aria-label={t("console.bim.view.canvasAriaLabel", undefined, "3D BIM viewer canvas")}
      />
      <p className="text-[10px] text-[var(--p-text-2)]">
        {t(
          "console.bim.view.hint",
          undefined,
          "Drag to orbit, scroll to zoom. IFC parsing via web-ifc (WASM). For Revit / Navisworks, use Autodesk Forge — not bundled here.",
        )}
      </p>
    </div>
  );
}
