import * as THREE from "three";

// This module is loaded after hydration; no WebGL code runs during SSR.
export function createMiningScene(host: HTMLElement, isRunning: () => boolean) {
  const tokens = getComputedStyle(host);
  const color = (name: string) => tokens.getPropertyValue(`--miner-${name}`).trim();
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-3, 3, 2.25, -2.25, .1, 50);
  camera.position.set(4, 3.2, 7);
  camera.lookAt(0, 1.05, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0, 0);
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");

  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const mat = (name: string) => {
    const existing = materials.get(name);
    if (existing) return existing;
    const material = new THREE.MeshStandardMaterial({ color: color(name), roughness: name === "metal" ? .3 : .8, metalness: name === "metal" ? .65 : 0 });
    materials.set(name, material);
    return material;
  };
  function mesh(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: string, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) {
    const object = new THREE.Mesh(geometry, mat(material));
    object.position.set(x, y, z);
    object.scale.set(sx, sy, sz);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  const sphere = (p: THREE.Object3D, m: string, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) => mesh(p, new THREE.SphereGeometry(1, 24, 16), m, x, y, z, sx, sy, sz);
  const capsule = (p: THREE.Object3D, m: string, x: number, y: number, z: number, radius: number, length: number) => mesh(p, new THREE.CapsuleGeometry(radius, length, 6, 12), m, x, y, z);

  scene.add(new THREE.HemisphereLight(color("light"), color("ground"), 2.4));
  const key = new THREE.DirectionalLight(color("light"), 3.4);
  key.position.set(-3, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  key.shadow.normalBias = .025;
  scene.add(key);
  const rim = new THREE.DirectionalLight(color("crystal"), 1.6);
  rim.position.set(3, 3, -3);
  scene.add(rim);

  const floor = mesh(scene, new THREE.CylinderGeometry(2.5, 2.7, .18, 48), "ground", 0, -.12, 0, 1, 1, .58);
  floor.receiveShadow = true;
  for (let i = 0; i < 12; i++) {
    const a = i * 2.4;
    mesh(scene, new THREE.DodecahedronGeometry(.09 + (i % 3) * .025), "ore", Math.cos(a) * 2.1, .02, Math.sin(a) * 1.05);
  }

  const tiger = new THREE.Group();
  tiger.position.set(-.85, 0, .12);
  scene.add(tiger);
  const torso = new THREE.Group();
  torso.position.y = .72;
  tiger.add(torso);
  sphere(torso, "fur", 0, .28, 0, .43, .6, .32);
  sphere(torso, "muzzle", .07, .24, .28, .28, .42, .07);
  for (let i = 0; i < 4; i++) {
    const stripe = sphere(torso, "stripe", -.35, -.04 + i * .2, .13, .11, .038, .24);
    stripe.rotation.z = -.25;
    sphere(torso, "stripe", .32, -.03 + i * .2, -.05, .1, .035, .26);
  }
  const head = new THREE.Group();
  head.position.set(0, .92, .02);
  torso.add(head);
  sphere(head, "fur", 0, 0, 0, .5, .45, .4);
  [-1, 1].forEach(side => {
    sphere(head, "fur", side * .35, .32, 0, .17, .2, .12);
    sphere(head, "stripe", side * .35, .33, .095, .09, .12, .035);
    sphere(head, "muzzle", side * .17, -.14, .34, .22, .15, .12);
    for (let i = 0; i < 3; i++) {
      const stripe = sphere(head, "stripe", side * (.33 + i * .015), .05 - i * .115, .27, .13, .028, .055);
      stripe.rotation.z = side * -.25;
    }
  });
  sphere(head, "eye", 0, -.09, .462, .085, .06, .04);
  const eyes: THREE.Mesh[] = [];
  const eyeDetails: THREE.Mesh[] = [];
  [-1, 1].forEach(side => {
    eyeDetails.push(sphere(head, "muzzle", side * .18, .07, .354, .11, .13, .055));
    eyes.push(sphere(head, "eye", side * .18, .08, .402, .055, .08, .024));
    eyeDetails.push(sphere(head, "light", side * .17, .11, .423, .016));
  });
  const helmet = sphere(head, "helmet", 0, .3, -.015, .47, .22, .4);
  mesh(head, new THREE.CylinderGeometry(.5, .5, .045, 32), "helmet", 0, .22, .01, 1, 1, .88);
  sphere(head, "metal", 0, .34, .35, .105, .1, .045);
  sphere(head, "light", 0, .34, .39, .07, .067, .014);

  const legs: THREE.Group[] = [];
  [-1, 1].forEach(side => {
    const leg = new THREE.Group();
    leg.position.set(side * .24, .66, 0);
    tiger.add(leg);
    capsule(leg, "fur", 0, -.25, 0, .15, .24);
    sphere(leg, "stripe", 0, -.23, .135, .145, .033, .04);
    sphere(leg, "fur", 0, -.5, .12, .21, .13, .26);
    legs.push(leg);
  });
  const tail = new THREE.Group();
  tail.position.set(-.28, .85, -.22);
  torso.add(tail);
  const tailCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -.6, 0), new THREE.Vector3(-.4, -.55, -.1), new THREE.Vector3(-.7, -.4, .02), new THREE.Vector3(-.65, -.18, .1)]);
  mesh(tail, new THREE.TubeGeometry(tailCurve, 24, .075, 8, false), "fur", 0, 0, 0);
  for (let i = 1; i < 7; i++) {
    const point = tailCurve.getPoint(i / 8);
    sphere(tail, "stripe", point.x, point.y, point.z, .078, .055, .08);
  }

  // Shoulder pivots move the paws and tool together, not a flat picture.
  const arms: THREE.Group[] = [];
  [-1, 1].forEach(side => {
    const arm = new THREE.Group();
    arm.position.set(side * .33, .62, side === 1 ? .18 : .32);
    torso.add(arm);
    capsule(arm, "fur", .18, -.16, 0, .12, .3).rotation.z = -.85;
    sphere(arm, "stripe", .16, -.14, .105, .08, .03, .035);
    sphere(arm, "fur", .38, -.31, 0, .15, .13, .14);
    arms.push(arm);
  });
  const tool = new THREE.Group();
  tool.position.set(.37, -.3, 0);
  arms[1]?.add(tool);
  capsule(tool, "handle", 0, .34, 0, .043, 1.08);
  const blade = new THREE.CatmullRomCurve3([new THREE.Vector3(-.48, .73, 0), new THREE.Vector3(-.24, .88, 0), new THREE.Vector3(0, .91, 0), new THREE.Vector3(.26, .86, 0), new THREE.Vector3(.47, .69, 0)]);
  mesh(tool, new THREE.TubeGeometry(blade, 16, .07, 8, false), "metal", 0, 0, 0);

  const ore = new THREE.Group();
  ore.position.set(1.03, .4, .12);
  scene.add(ore);
  const boulder = mesh(ore, new THREE.DodecahedronGeometry(.65, 0), "ore", 0, 0, 0, 1, .9, .85);
  boulder.rotation.set(.2, .5, .1);
  for (let i = 0; i < 7; i++) {
    const a = i * 2.3;
    const crystal = mesh(ore, new THREE.OctahedronGeometry(.18), i % 2 ? "helmet" : "crystal", Math.cos(a) * .43, .12 + (i % 3) * .13, Math.sin(a) * .35, .7, 1.5, .8);
    crystal.rotation.z = a;
  }
  const chips = Array.from({ length: 10 }, (_, i) => mesh(scene, new THREE.TetrahedronGeometry(.045 + (i % 3) * .02), i % 2 ? "helmet" : "crystal", 0, 0, 0));
  const impact = new THREE.PointLight(color("helmet"), 0, 2.5);
  impact.position.set(.75, .85, .3);
  scene.add(impact);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let disposed = false;
  let active = isRunning() ? 1 : 0;
  let last = performance.now();
  let time = 0;
  let dragging = false;
  let pointer = 0;
  let angle = 0;
  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height);
    const aspect = width / height;
    camera.left = -1.65 * aspect;
    camera.right = 1.65 * aspect;
    camera.top = 1.65;
    camera.bottom = -1.65;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const down = (event: PointerEvent) => { dragging = true; pointer = event.clientX; };
  const move = (event: PointerEvent) => {
    if (!dragging) return;
    angle = THREE.MathUtils.clamp(angle + (event.clientX - pointer) * .008, -.45, .45);
    pointer = event.clientX;
  };
  const up = () => { dragging = false; };
  host.addEventListener("pointerdown", down);
  host.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  function render(timestamp: number) {
    if (disposed) return;
    const dt = Math.min((timestamp - last) / 1000, .05);
    last = timestamp;
    if (document.visibilityState !== "hidden") {
      time += dt;
      active = THREE.MathUtils.damp(active, isRunning() ? 1 : 0, 8, dt);
      const phase = reducedMotion.matches ? .58 : (time % 1.6) / 1.6;
      // Slow lift, fast downstroke, then recoil at contact.
      const swing = phase < .52 ? THREE.MathUtils.smoothstep(phase, 0, .52) : phase < .68 ? 1 - THREE.MathUtils.smoothstep(phase, .52, .68) : 0;
      torso.position.y = THREE.MathUtils.lerp(.3, .72, active);
      torso.rotation.z = THREE.MathUtils.lerp(-1.12, -.04 + .08 * swing, active);
      torso.position.x = -.17 * (1 - active);
      head.rotation.z = THREE.MathUtils.lerp(.8, -.1 * swing, active);
      head.position.y = .92;
      tiger.scale.y = reducedMotion.matches ? 1 : 1 + Math.sin(time * 2) * .012 * (1 - active);
      legs.forEach((leg, i) => { leg.rotation.z = (1 - active) * (i ? -1.05 : .9); leg.position.y = THREE.MathUtils.lerp(.23, .66, active); });
      arms.forEach((arm, i) => { arm.rotation.z = THREE.MathUtils.lerp(.7, -1.1 + swing * 2.3, active); arm.rotation.y = i ? 0 : -.35 * active; });
      tool.visible = active > .35;
      helmet.visible = true;
      eyes.forEach(eye => { eye.scale.y = THREE.MathUtils.lerp(.012, .08, active); });
      eyeDetails.forEach(detail => { detail.visible = active > .6; });
      tail.rotation.y = reducedMotion.matches ? 0 : Math.sin(time * 1.8) * .12 * active;
      tail.rotation.z = -1.3 * (1 - active);
      const burst = phase >= .68 && phase < .95 && active > .8 && !reducedMotion.matches;
      const p = (phase - .68) / .27;
      chips.forEach((chip, i) => {
        chip.visible = burst;
        if (!burst) return;
        const a = i * 2.399;
        chip.position.set(.8 + Math.cos(a) * p * .8, .8 + Math.sin(p * Math.PI) * (.4 + (i % 3) * .16), .25 + Math.sin(a) * p * .6);
        chip.rotation.set(p * 8, a, p * 5);
        chip.scale.setScalar(1 - p * .75);
      });
      impact.intensity = burst ? (1 - p) * 2 : 0;
      ore.rotation.z = burst ? Math.sin(p * 18) * .02 * (1 - p) : 0;
      camera.position.set(7 * Math.sin(.52 + angle), 3.2, 7 * Math.cos(.52 + angle));
      camera.lookAt(0, 1.03, 0);
      renderer.render(scene, camera);
      host.dataset["pose"] = active > .5 ? "mining" : "sleeping";
    }
    frame = requestAnimationFrame(render);
  }
  resize();
  frame = requestAnimationFrame(render);
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    host.removeEventListener("pointerdown", down);
    host.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    scene.traverse(object => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
    materials.forEach(material => material.dispose());
    renderer.dispose();
    renderer.domElement.remove();
  };
}