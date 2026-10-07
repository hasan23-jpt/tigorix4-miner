import * as THREE from "three";

/** Articulated low-poly 3D tiger that mines ore when running and sleeps when idle. */
export function createMiningScene(host: HTMLElement, onStrike: () => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 2.2, 7.5);
  camera.lookAt(0, 0.9, 0);

  scene.add(new THREE.HemisphereLight(0xfff1c8, 0x3a2410, 1.4));
  const sun = new THREE.DirectionalLight(0xffd27a, 2.2);
  sun.position.set(3, 6, 4);
  scene.add(sun);

  const mat = (c: number, r = 0.7) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
  const orange = mat(0xe8862a), stripe = mat(0x1a1208), white = mat(0xf4ead8), dark = mat(0x111111);
  const wood = mat(0x7a4a22), steel = new THREE.MeshStandardMaterial({ color: 0xb8c0c8, metalness: 0.8, roughness: 0.3 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xffc23a, metalness: 0.9, roughness: 0.25, emissive: 0x3a2400 });

  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, p: [number, number, number], parent: THREE.Object3D) => {
    const o = new THREE.Mesh(g, m);
    o.position.set(...p);
    parent.add(o);
    return o;
  };

  // Ground + ore
  mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.2, 32), mat(0x3b2614, 1), [0, -0.1, 0], scene);
  const ore = new THREE.Group();
  ore.position.set(1.55, 0, 0.2);
  scene.add(ore);
  mesh(new THREE.DodecahedronGeometry(0.75, 0), mat(0x5a4632, 0.95), [0, 0.55, 0], ore);
  for (let i = 0; i < 5; i++)
    mesh(new THREE.OctahedronGeometry(0.16 + Math.random() * 0.08), gold,
      [Math.cos(i * 1.3) * 0.5, 0.5 + Math.sin(i * 2) * 0.35, Math.sin(i * 1.3) * 0.5 + 0.2], ore);

  // Tiger
  const tiger = new THREE.Group();
  tiger.position.set(-0.6, 0, 0);
  scene.add(tiger);
  const body = new THREE.Group();
  body.position.y = 0.95;
  tiger.add(body);
  const torso = mesh(new THREE.CapsuleGeometry(0.42, 0.9, 6, 12), orange, [0, 0, 0], body);
  torso.rotation.z = Math.PI / 2;
  for (let i = -2; i <= 2; i++) {
    const s = mesh(new THREE.TorusGeometry(0.43, 0.04, 6, 16, Math.PI), stripe, [i * 0.22, 0, 0], body);
    s.rotation.y = Math.PI / 2;
  }
  mesh(new THREE.SphereGeometry(0.36, 16, 12), white, [0.05, -0.18, 0], body).scale.set(1.6, 0.6, 0.9);

  const head = new THREE.Group();
  head.position.set(0.85, 0.35, 0);
  body.add(head);
  mesh(new THREE.SphereGeometry(0.42, 20, 16), orange, [0, 0, 0], head);
  mesh(new THREE.SphereGeometry(0.22, 16, 12), white, [0.3, -0.1, 0], head).scale.set(1, 0.8, 1.3);
  mesh(new THREE.SphereGeometry(0.06, 8, 8), dark, [0.5, -0.02, 0], head);
  const eyes: THREE.Mesh[] = [];
  for (const z of [-0.16, 0.16]) {
    eyes.push(mesh(new THREE.SphereGeometry(0.06, 10, 8), dark, [0.33, 0.12, z], head));
    const ear = mesh(new THREE.ConeGeometry(0.13, 0.22, 8), orange, [-0.05, 0.38, z * 1.6], head);
    ear.rotation.x = z > 0 ? 0.3 : -0.3;
    const st = mesh(new THREE.BoxGeometry(0.05, 0.18, 0.04), stripe, [0.1, 0.32, z * 0.6], head);
    st.rotation.z = 0.3;
  }

  const legs: THREE.Group[] = [];
  for (const [x, z] of [[0.45, 0.25], [0.45, -0.25], [-0.45, 0.25], [-0.45, -0.25]] as const) {
    const leg = new THREE.Group();
    leg.position.set(x, -0.2, z);
    body.add(leg);
    mesh(new THREE.CapsuleGeometry(0.12, 0.45, 4, 8), orange, [0, -0.35, 0], leg);
    mesh(new THREE.SphereGeometry(0.14, 10, 8), white, [0.04, -0.68, 0], leg);
    legs.push(leg);
  }
  const tail = new THREE.Group();
  tail.position.set(-0.85, 0.1, 0);
  body.add(tail);
  const tm = mesh(new THREE.CapsuleGeometry(0.07, 0.8, 4, 8), orange, [-0.3, 0.3, 0], tail);
  tm.rotation.z = 0.8;

  // Pickaxe held by front-right paw
  const arm = legs[0]!;
  const pick = new THREE.Group();
  pick.position.set(0.05, -0.65, 0.12);
  arm.add(pick);
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), wood, [0.5, 0, 0], pick).rotation.z = Math.PI / 2;
  const blade = mesh(new THREE.TorusGeometry(0.32, 0.05, 6, 16, Math.PI), steel, [1.05, 0, 0], pick);
  blade.rotation.z = -Math.PI / 2;

  // Particles
  const chips: { m: THREE.Mesh; v: THREE.Vector3; life: number }[] = [];
  const chipGeo = new THREE.TetrahedronGeometry(0.06);
  const zz = new THREE.Group();
  scene.add(zz);

  let running = false;
  let blend = 0;
  let t = 0;
  let lastPhase = 0;
  let dragX = 0;
  let raf = 0;
  const clock = new THREE.Clock();

  const resize = () => {
    const w = host.clientWidth || 300, h = host.clientHeight || 180;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect();
    dragX = ((e.clientX - r.left) / r.width - 0.5) * 0.6;
  };
  host.addEventListener("pointermove", onMove);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const loop = () => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    t += reduce ? dt * 0.3 : dt;
    blend += ((running ? 1 : 0) - blend) * (1 - Math.exp(-4 * dt));

    // swing phase: wind up then strike
    const cyc = (t * 1.4) % 1;
    const swing = cyc < 0.7 ? -1.6 * (cyc / 0.7) : -1.6 + 2.6 * ((cyc - 0.7) / 0.3);
    if (running && lastPhase < 0.98 && cyc >= 0.98 - 0.0001 && cyc < 1) { /* noop */ }
    if (running && lastPhase > cyc) {
      onStrike();
      for (let i = 0; i < 6; i++) {
        const m = new THREE.Mesh(chipGeo, i % 2 ? gold : mat(0x8a6a48));
        m.position.set(1.0, 0.8, 0.2);
        scene.add(m);
        chips.push({ m, v: new THREE.Vector3(Math.random() * 2 - 0.4, 2 + Math.random() * 2, Math.random() * 2 - 1), life: 0.8 });
      }
      ore.scale.setScalar(0.94);
    }
    lastPhase = cyc;
    ore.scale.lerp(new THREE.Vector3(1, 1, 1), 1 - Math.exp(-10 * dt));

    // Mining pose (standing) vs sleeping pose (lying down)
    const breathe = Math.sin(t * 1.6) * 0.03;
    body.position.y = THREE.MathUtils.lerp(0.42 + breathe, 0.95 + Math.abs(Math.sin(t * 2.8)) * 0.03, blend);
    body.rotation.z = THREE.MathUtils.lerp(0, 0.15 + (running ? swing * -0.05 : 0), blend);
    head.rotation.z = THREE.MathUtils.lerp(-0.35, 0.05, blend);
    head.position.y = THREE.MathUtils.lerp(0.05, 0.35, blend);
    legs.forEach((l, i) => {
      l.rotation.z = THREE.MathUtils.lerp(i < 2 ? -1.3 : 1.3, 0, blend);
    });
    arm.rotation.z = THREE.MathUtils.lerp(-1.3, 0.6 + swing, blend);
    pick.visible = blend > 0.3;
    for (const e of eyes) e.scale.y = THREE.MathUtils.lerp(0.15, 1, blend);
    tail.rotation.z = Math.sin(t * (running ? 4 : 1)) * 0.3;
    tiger.rotation.y = dragX;

    for (let i = chips.length - 1; i >= 0; i--) {
      const c = chips[i]!;
      c.life -= dt;
      c.v.y -= 9 * dt;
      c.m.position.addScaledVector(c.v, dt);
      c.m.rotation.x += dt * 8;
      if (c.life <= 0) {
        scene.remove(c.m);
        chips.splice(i, 1);
      }
    }
    zz.visible = blend < 0.2;
    renderer.render(scene, camera);
  };
  loop();

  return {
    setRunning(v: boolean) { running = v; },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
