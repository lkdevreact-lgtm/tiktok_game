import * as THREE from "three";

// ── Spaceship 1: Fighter (Cyan, sleek delta wing) ──
export function createSpaceship1() {
  const group = new THREE.Group();

  // Body
  const bodyGeo = new THREE.ConeGeometry(0.08, 0.5, 6);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x00ccee,
    emissive: 0x006688,
    emissiveIntensity: 0.6,
    metalness: 0.8,
    roughness: 0.2,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.rotation.z = -Math.PI / 2;
  group.add(body);

  // Wings
  const wingGeo = new THREE.BoxGeometry(0.04, 0.28, 0.04);
  const wingMat = new THREE.MeshStandardMaterial({ color: 0x00f5ff, emissive: 0x00aacc, emissiveIntensity: 0.5, metalness: 0.9, roughness: 0.2 });
  [-1, 1].forEach((sign) => {
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(-0.1, sign * 0.14, 0);
    wing.rotation.z = sign * 0.3;
    group.add(wing);
  });

  // Engine glow
  const engineGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const engineMat = new THREE.MeshStandardMaterial({ color: 0x00f5ff, emissive: 0x00f5ff, emissiveIntensity: 2, transparent: true, opacity: 0.9 });
  const engine = new THREE.Mesh(engineGeo, engineMat);
  engine.position.set(-0.28, 0, 0);
  group.add(engine);

  // Gun tip marker (invisible, used for bullet spawn)
  const gunTip = new THREE.Object3D();
  gunTip.name = "gun_tip";
  gunTip.position.set(0.3, 0, 0);
  group.add(gunTip);

  return group;
}

// ── Spaceship 2: Cruiser (Purple, wider body) ──
export function createSpaceship2() {
  const group = new THREE.Group();

  const bodyGeo = new THREE.BoxGeometry(0.5, 0.1, 0.12);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x9900cc, emissive: 0x440066, emissiveIntensity: 0.7, metalness: 0.8, roughness: 0.2 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  // Canopy
  const canopyGeo = new THREE.CylinderGeometry(0.04, 0.07, 0.12, 8);
  const canopyMat = new THREE.MeshStandardMaterial({ color: 0xcc66ff, emissive: 0x9900cc, emissiveIntensity: 0.5, transparent: true, opacity: 0.85 });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.rotation.z = Math.PI / 2;
  canopy.position.set(0.08, 0.1, 0);
  group.add(canopy);

  // Wings
  const wingGeo = new THREE.BoxGeometry(0.3, 0.02, 0.22);
  const wingMat = new THREE.MeshStandardMaterial({ color: 0xbf00ff, emissive: 0x6600aa, emissiveIntensity: 0.4, metalness: 0.9, roughness: 0.1 });
  const wing = new THREE.Mesh(wingGeo, wingMat);
  group.add(wing);

  // Engines (2)
  const engGeo = new THREE.SphereGeometry(0.045, 8, 8);
  const engMat = new THREE.MeshStandardMaterial({ color: 0xcc00ff, emissive: 0xcc00ff, emissiveIntensity: 2.5 });
  [-0.09, 0.09].forEach((z) => {
    const eng = new THREE.Mesh(engGeo, engMat);
    eng.position.set(-0.26, 0, z);
    group.add(eng);
  });

  const gunTip = new THREE.Object3D();
  gunTip.name = "gun_tip";
  gunTip.position.set(0.28, 0, 0);
  group.add(gunTip);

  return group;
}

// ── Spaceship 3: Destroyer (Gold, heavy fighter) ──
export function createSpaceship3() {
  const group = new THREE.Group();

  // Main hull
  const hullGeo = new THREE.BoxGeometry(0.55, 0.14, 0.18);
  const hullMat = new THREE.MeshStandardMaterial({ color: 0xaa6600, emissive: 0x553300, emissiveIntensity: 0.5, metalness: 0.9, roughness: 0.15 });
  const hull = new THREE.Mesh(hullGeo, hullMat);
  group.add(hull);

  // Nose cone
  const noseGeo = new THREE.ConeGeometry(0.08, 0.2, 6);
  const noseMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xaa6600, emissiveIntensity: 0.8, metalness: 0.95, roughness: 0.1 });
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.rotation.z = -Math.PI / 2;
  nose.position.set(0.36, 0, 0);
  group.add(nose);

  // Heavy wings
  const wingGeo = new THREE.BoxGeometry(0.35, 0.02, 0.3);
  const wingMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x885500, emissiveIntensity: 0.4, metalness: 0.95, roughness: 0.1 });
  const wing = new THREE.Mesh(wingGeo, wingMat);
  group.add(wing);

  // Dual barrels
  const barrelGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.25, 6);
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0xffdd88, emissive: 0xffaa00, emissiveIntensity: 0.4 });
  [-0.06, 0.06].forEach((z) => {
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.38, 0, z);
    group.add(barrel);
  });

  // 4 Engines
  const engGeo = new THREE.SphereGeometry(0.055, 8, 8);
  const engMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0xffaa00, emissiveIntensity: 3 });
  [[-0.3, -0.08], [-0.3, 0.08], [-0.24, -0.12], [-0.24, 0.12]].forEach(([x, z]) => {
    const eng = new THREE.Mesh(engGeo, engMat);
    eng.position.set(x, 0, z);
    group.add(eng);
  });

  const gunTip = new THREE.Object3D();
  gunTip.name = "gun_tip";
  gunTip.position.set(0.5, 0, 0);
  group.add(gunTip);

  return group;
}

// ── Boss Ship ──
export function createBoss() {
  const group = new THREE.Group();
  group.name = "boss";

  // Main body (octahedron-ish)
  const bodyGeo = new THREE.OctahedronGeometry(0.35, 1);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x330011,
    emissive: 0xff0044,
    emissiveIntensity: 0.4,
    metalness: 0.7,
    roughness: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.scale.set(1.6, 0.6, 1.0);
  group.add(body);

  // Spikes
  const spikeGeo = new THREE.ConeGeometry(0.07, 0.45, 6);
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0xff0033, emissive: 0xff0033, emissiveIntensity: 0.8 });
  const spikeConfigs = [
    { pos: [0, 0.3, 0],  rot: [0, 0, 0] },
    { pos: [0, -0.3, 0], rot: [Math.PI, 0, 0] },
    { pos: [0.4, 0, 0],  rot: [0, 0, -Math.PI/2] },
    { pos: [-0.4, 0, 0], rot: [0, 0, Math.PI/2] },
  ];
  spikeConfigs.forEach(({ pos, rot }) => {
    const spike = new THREE.Mesh(spikeGeo, spikeMat);
    spike.position.set(...pos);
    spike.rotation.set(...rot);
    group.add(spike);
  });

  // Glowing core
  const coreGeo = new THREE.SphereGeometry(0.12, 12, 12);
  const coreMat = new THREE.MeshStandardMaterial({ color: 0xff3366, emissive: 0xff3366, emissiveIntensity: 3, transparent: true, opacity: 0.9 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.name = "boss_core";
  group.add(core);

  // Shield ring
  const ringGeo = new THREE.TorusGeometry(0.52, 0.025, 8, 48);
  const ringMat = new THREE.MeshStandardMaterial({ color: 0xff0066, emissive: 0xff0066, emissiveIntensity: 1.5, transparent: true, opacity: 0.7 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.name = "boss_ring";
  group.add(ring);

  // Shield ring 2 (perpendicular)
  const ring2 = ring.clone();
  ring2.rotation.x = Math.PI / 2;
  group.add(ring2);

  return group;
}

// ── Bullet ──
export function createBullet(color = 0x00f5ff) {
  const group = new THREE.Group();

  const geo = new THREE.SphereGeometry(0.025, 8, 8);
  const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 3, transparent: true, opacity: 0.95 });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  // Trail glow
  const trailGeo = new THREE.CylinderGeometry(0.012, 0.025, 0.12, 6);
  const trailMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2, transparent: true, opacity: 0.5 });
  const trail = new THREE.Mesh(trailGeo, trailMat);
  trail.rotation.z = Math.PI / 2;
  trail.position.set(-0.07, 0, 0);
  group.add(trail);

  return group;
}

// ── Explosion Particles ──
export function createExplosion(position, color = 0xff6600) {
  const particles = [];
  const count = 12;

  for (let i = 0; i < count; i++) {
    const geo = new THREE.SphereGeometry(0.02 + Math.random() * 0.03, 6, 6);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 3,
      transparent: true,
      opacity: 1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.06,
      (Math.random() - 0.5) * 0.06,
      (Math.random() - 0.5) * 0.04
    );

    particles.push({ mesh, velocity, life: 1.0 });
  }

  return particles;
}
