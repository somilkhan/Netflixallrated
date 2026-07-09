import { useEffect, useRef, useState } from 'react';
import {
  STAR_OUTLINE, FACET_TOP_RIGHT, FACET_BOTTOM_RIGHT, FACET_BOTTOM_LEFT, FACET_TOP_LEFT, BRAND,
} from './mark';
import AnimatedLogoMark from './AnimatedLogoMark';

/**
 * Lightweight Three.js interactive version of the Aperture Star — inspired
 * by "dithered logo" interaction toys (slow auto-rotate, drag-to-spin,
 * click pulse, cursor/device-tilt parallax) but rendered as a frosted-glass
 * burgundy gem instead of a particle field, matching the brand's material
 * language.
 *
 * Kept intentionally small: one mesh built from the same 2D facet paths
 * (extruded), one directional + one point light, no postprocessing, no
 * texture loads. Three is dynamically imported so it never weighs down the
 * initial app bundle.
 */
export default function InteractiveLogoScene({
  size = 320,
  className = '',
}: { size?: number; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const [THREE, { SVGLoader }] = await Promise.all([
        import('three'),
        import('three/examples/jsm/loaders/SVGLoader.js'),
      ]);
      if (disposed || !hostRef.current) return;
      const host = hostRef.current;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      camera.position.set(0, 0, 6.4);

      let renderer: any;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        // Force a context probe now so unsupported environments fall back immediately.
        if (!renderer.getContext()) throw new Error('no-webgl-context');
      } catch {
        setFailed(true);
        return;
      }
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(size, size);
      host.appendChild(renderer.domElement);

      // Build the star + facets as an extruded group from the same SVG paths.
      const group = new THREE.Group();
      const loader = new SVGLoader();
      const svgMarkup = `<svg viewBox="0 0 100 100">
        <path d="${FACET_TOP_RIGHT}" fill="${BRAND.rose}" />
        <path d="${FACET_BOTTOM_RIGHT}" fill="${BRAND.maroonBright}" />
        <path d="${FACET_BOTTOM_LEFT}" fill="${BRAND.maroonDeep}" />
        <path d="${FACET_TOP_LEFT}" fill="${BRAND.maroon}" />
        <path d="${STAR_OUTLINE}" fill="none" />
      </svg>`;
      const parsed = loader.parse(svgMarkup);

      const disposables: Array<{ dispose: () => void }> = [];
      const extrudeSettings = { depth: 9, bevelEnabled: true, bevelThickness: 1.6, bevelSize: 1.2, bevelSegments: 3 };
      parsed.paths.forEach((path: any) => {
        const shapes = path.toShapes(true);
        shapes.forEach((shape: any) => {
          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          const color = new THREE.Color(path.color ?? BRAND.maroonBright);
          const material = new THREE.MeshPhysicalMaterial({
            color,
            transparent: true,
            opacity: 0.88,
            roughness: 0.18,
            metalness: 0.05,
            transmission: 0.55,
            thickness: 1.2,
            clearcoat: 1,
            clearcoatRoughness: 0.15,
          });
          disposables.push(geometry, material);
          const mesh = new THREE.Mesh(geometry, material);
          group.add(mesh);
        });
      });

      // Normalize scale/centering (SVG coords are 0–100, Y-down).
      group.scale.set(0.026, -0.026, 0.026);
      group.position.set(-1.3, 1.3, -0.5);
      const wrapper = new THREE.Group();
      wrapper.add(group);
      scene.add(wrapper);

      const ambient = new THREE.AmbientLight(0xffffff, 0.5);
      const key = new THREE.DirectionalLight(0xffe9ea, 1.1);
      key.position.set(3, 4, 5);
      const rim = new THREE.PointLight(0xc2434f, 3.2, 20);
      rim.position.set(-3, -2, 4);
      scene.add(ambient, key, rim);

      let autoRotate = !reduceMotion;
      let dragging = false;
      let lastX = 0, lastY = 0;
      let velX = 0.0025, velY = 0;
      let pulse = 0;
      let targetTiltX = 0, targetTiltY = 0;

      const onDown = (x: number, y: number) => { dragging = true; autoRotate = false; lastX = x; lastY = y; };
      const onMove = (x: number, y: number) => {
        if (!dragging) return;
        velY = (x - lastX) * 0.006;
        velX = (y - lastY) * 0.006;
        lastX = x; lastY = y;
      };
      const onUp = () => { dragging = false; };
      const onClick = () => { pulse = 1; };

      const pointerDown = (e: PointerEvent) => onDown(e.clientX, e.clientY);
      const pointerMove = (e: PointerEvent) => onMove(e.clientX, e.clientY);
      const pointerUp = () => onUp();

      renderer.domElement.addEventListener('pointerdown', pointerDown);
      window.addEventListener('pointermove', pointerMove);
      window.addEventListener('pointerup', pointerUp);
      renderer.domElement.addEventListener('click', onClick);

      const onMouseParallax = (e: MouseEvent) => {
        const rect = host.getBoundingClientRect();
        targetTiltY = ((e.clientX - rect.left) / rect.width - 0.5) * 0.35;
        targetTiltX = ((e.clientY - rect.top) / rect.height - 0.5) * -0.35;
      };
      if (!reduceMotion) window.addEventListener('mousemove', onMouseParallax);

      const onOrientation = (e: DeviceOrientationEvent) => {
        if (e.gamma == null || e.beta == null) return;
        targetTiltY = Math.max(-1, Math.min(1, e.gamma / 45)) * 0.3;
        targetTiltX = Math.max(-1, Math.min(1, (e.beta - 45) / 45)) * -0.3;
      };
      if (!reduceMotion) window.addEventListener('deviceorientation', onOrientation);

      let raf = 0;
      const clock = new THREE.Clock();
      const tick = () => {
        raf = requestAnimationFrame(tick);
        const dt = Math.min(clock.getDelta(), 0.05);

        if (!dragging) {
          velX *= 0.94;
          velY *= 0.94;
          if (autoRotate) velY += 0.0009;
        }
        wrapper.rotation.x += velX;
        wrapper.rotation.y += velY;

        wrapper.position.x += ((targetTiltY) - wrapper.position.x) * 0.06;
        wrapper.position.y += ((targetTiltX) - wrapper.position.y) * 0.06;

        if (pulse > 0) {
          pulse = Math.max(0, pulse - dt * 2.2);
          const s = 1 + pulse * 0.18;
          wrapper.scale.setScalar(s);
          rim.intensity = 3.2 + pulse * 6;
        } else {
          wrapper.scale.setScalar(1);
          rim.intensity = 3.2;
        }

        renderer.render(scene, camera);
      };
      tick();

      const onResize = () => {
        const w = host.clientWidth || size;
        renderer.setSize(w, w);
        camera.aspect = 1;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', onResize);
      onResize();

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('pointermove', pointerMove);
        window.removeEventListener('pointerup', pointerUp);
        window.removeEventListener('mousemove', onMouseParallax);
        window.removeEventListener('deviceorientation', onOrientation);
        window.removeEventListener('resize', onResize);
        renderer.domElement.removeEventListener('pointerdown', pointerDown);
        renderer.domElement.removeEventListener('click', onClick);
        disposables.forEach((d) => d.dispose());
        renderer.dispose();
        host.removeChild(renderer.domElement);
      };
    })();

    return () => { disposed = true; cleanup(); };
  }, [size]);

  if (failed) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <AnimatedLogoMark size={size * 0.6} breathe shimmer glow interactive intro={false} />
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className={`relative touch-none select-none cursor-grab active:cursor-grabbing ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Interactive NetflixAllrated logo — drag to rotate, click to pulse"
    />
  );
}
