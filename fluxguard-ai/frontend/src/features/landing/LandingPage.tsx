import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // 1. Scene Setup
    const width = container.clientWidth;
    const height = container.clientHeight;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a1128, 0.015);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 0, 0);

    // 3. Renderer Setup
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      console.warn('WebGL is not supported in this environment');
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    dirLight.position.set(5, 20, 10);
    scene.add(dirLight);

    // 5. Creating 3D Stadium Wireframe
    const stadiumGroup = new THREE.Group();

    // Concentric stadium tiers rings
    const ringMaterials = new THREE.LineBasicMaterial({
      color: 0x0891b2,
      transparent: true,
      opacity: 0.4,
    });

    const tierCount = 5;
    for (let i = 0; i < tierCount; i++) {
      const radius = 6 + i * 2.2;
      const ringHeight = i * 0.9;

      const segments = 64;
      const points = [];
      for (let j = 0; j <= segments; j++) {
        const theta = (j / segments) * Math.PI * 2;
        points.push(
          new THREE.Vector3(Math.cos(theta) * radius, ringHeight, Math.sin(theta) * radius),
        );
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const ring = new THREE.Line(geometry, ringMaterials);
      stadiumGroup.add(ring);
    }

    // Connect vertical grid ribs
    const ribCount = 32;
    for (let i = 0; i < ribCount; i++) {
      const theta = (i / ribCount) * Math.PI * 2;
      const points = [];
      for (let j = 0; j < tierCount; j++) {
        const radius = 6 + j * 2.2;
        const ringHeight = j * 0.9;
        points.push(
          new THREE.Vector3(Math.cos(theta) * radius, ringHeight, Math.sin(theta) * radius),
        );
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, ringMaterials);
      stadiumGroup.add(line);
    }

    // Outer grid base plane representing floor sensors mapping
    const gridHelper = new THREE.GridHelper(40, 20, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -0.1;
    stadiumGroup.add(gridHelper);

    scene.add(stadiumGroup);

    // 6. Dynamic Crowd Flow Particle Streams
    const particleCount = 280;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const particleInfo: {
      angle: number;
      radius: number;
      speed: number;
      targetGate: number;
      height: number;
    }[] = [];

    const cyanColor = new THREE.Color(0x2dd4bf);
    const indigoColor = new THREE.Color(0x6366f1);

    for (let i = 0; i < particleCount; i++) {
      const targetGate = Math.floor(Math.random() * 4); // 4 major entrances
      const angle = (targetGate / 4) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
      const radius = 18 + Math.random() * 15;
      const speed = 0.05 + Math.random() * 0.09;
      const heightVal = 0.1 + Math.random() * 0.8;

      particleInfo.push({ angle, radius, speed, targetGate, height: heightVal });

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      positions[i * 3] = x;
      positions[i * 3 + 1] = heightVal;
      positions[i * 3 + 2] = z;

      // Color mix based on speed
      const mixedColor = cyanColor.clone().lerp(indigoColor, Math.random());
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom glowing point shader texture mock (simple round point)
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // 7. Glowing Risk hotpots rings at Gate coordinates
    const gates = [
      { x: 6, z: 0, color: 0xf43f5e, label: 'Gate C' }, // North Gate
      { x: -6, z: 0, color: 0x38bdf8, label: 'West Entrance' },
      { x: 0, z: 6, color: 0x10b981, label: 'East Concourse' },
    ];

    const hotspotGroup = new THREE.Group();
    gates.forEach((gate) => {
      const meshGeo = new THREE.RingGeometry(0.35, 0.45, 32);
      const meshMat = new THREE.MeshBasicMaterial({
        color: gate.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ringMesh = new THREE.Mesh(meshGeo, meshMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.set(gate.x, 0.1, gate.z);
      hotspotGroup.add(ringMesh);
    });
    scene.add(hotspotGroup);

    // 8. Interactive Parallax Control Variables
    let mouseX = 0;
    let mouseY = 0;
    let targetCameraX = 0;
    let targetCameraY = 15;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

      // Calculate target camera positions based on offsets
      targetCameraX = mouseX * 12;
      targetCameraY = 15 + mouseY * 7;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 9. Animation Loop
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Slow rotating stadium mesh
      stadiumGroup.rotation.y += 0.04 * delta;
      hotspotGroup.rotation.y += 0.04 * delta;

      // Pulsing hotspot size
      const time = clock.getElapsedTime();
      hotspotGroup.children.forEach((mesh, index) => {
        const scale = 1 + Math.sin(time * 4 + index) * 0.15;
        mesh.scale.set(scale, scale, 1);
      });

      // Camera position interpolation (Parallax smooth transition)
      camera.position.x += (targetCameraX - camera.position.x) * 0.03;
      camera.position.y += (targetCameraY - camera.position.y) * 0.03;
      camera.lookAt(0, 1.5, 0);

      // Animate crowd flow particles
      const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        const info = particleInfo[i];

        // Progressively decrease radius to flow towards the stadium gates
        info.radius -= info.speed * (25 * delta);

        // Reset when entering stadium bounds
        if (info.radius <= 6) {
          info.radius = 22 + Math.random() * 12;
          info.angle = (info.targetGate / 4) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
        }

        const x = Math.cos(info.angle) * info.radius;
        const z = Math.sin(info.angle) * info.radius;

        posAttr.setX(i, x);
        posAttr.setZ(i, z);
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 10. Resizing Handling
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Cleanups
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-68px)] bg-[#0a1128] overflow-hidden flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Absolute Fullscreen 3D Canvas Background */}
      <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none" />

      {/* Interactive Overlay Content */}
      <div className="relative z-10 max-w-4xl w-full text-center space-y-8 select-none">
        {/* Core Hero Headline */}
        <div className="space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 uppercase">
            Stadium Crowd Control Digital Twin
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 drop-shadow-[0_4px_12px_rgba(56,189,248,0.15)] uppercase">
            FluxGuard AI
          </h1>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-ink-muted leading-relaxed">
            Real-time dynamics monitoring, 40-minute forecasting algorithms, dynamic steward
            dispatch, and offline safety operations.
          </p>
        </div>

        {/* Primary Call-To-Action (CTAs) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white font-bold text-sm px-8 py-3 rounded-lg shadow-[0_4px_20px_rgba(14,165,233,0.25)] hover:shadow-[0_4px_25px_rgba(14,165,233,0.35)] transition-all cursor-pointer select-none"
          >
            Enter Command Center
          </button>
          <button
            onClick={() => navigate('/volunteer')}
            className="w-full sm:w-auto bg-slate-900/60 hover:bg-slate-900/90 text-ink border border-white/10 font-bold text-sm px-8 py-3 rounded-lg hover:border-cyan-500/30 transition-all cursor-pointer select-none backdrop-blur-sm"
          >
            Steward Volunteer Mode
          </button>
        </div>

        {/* Features Modules Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-12">
          <div className="rounded-xl border border-white/5 bg-slate-950/40 backdrop-blur-md p-4 text-left space-y-2 hover:border-cyan-500/20 transition-all">
            <div className="text-xl">📈</div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
              Predictive Forecasts
            </h3>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Prophet-enriched horizon analytics with 95% confidence intervals.
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-slate-950/40 backdrop-blur-md p-4 text-left space-y-2 hover:border-indigo-500/20 transition-all">
            <div className="text-xl">👮</div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
              Resource Allocation
            </h3>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Dynamic steward staffing suggestions based on live zone threats.
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-slate-950/40 backdrop-blur-md p-4 text-left space-y-2 hover:border-purple-500/20 transition-all">
            <div className="text-xl">⚡</div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
              Incident Console
            </h3>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Steward dispatcher queue matching live responders with ticketing.
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-slate-950/40 backdrop-blur-md p-4 text-left space-y-2 hover:border-rose-500/20 transition-all">
            <div className="text-xl">📴</div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Offline Sync</h3>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Volunteer observation queuing and auto synchronization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
