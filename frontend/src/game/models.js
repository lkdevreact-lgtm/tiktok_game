import * as THREE from "three";

// --- Hỗ trợ Visual Flare ---
export function createExhaustFlare(color) {
  const group = new THREE.Group();
  group.name = "engine_flare";

  // --- LỚP NGOÀI (OUTER CONE) ---
  const outerGeo = new THREE.ConeGeometry(0.12, 2.2, 12);
  outerGeo.rotateZ(-Math.PI / 2); // đỉnh tại tâm, đáy phụt về phía sau (+X)
  outerGeo.translate(1.1, 0, 0); // Đẩy toàn bộ hình nón ra sau

  const outerMat = new THREE.MeshBasicMaterial({
    color: color || 0x00f5ff,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const outerMesh = new THREE.Mesh(outerGeo, outerMat);
  outerMesh.name = "flare_outer";
  group.add(outerMesh);

  // --- LỚP LÕI (INNER CORE) ---
  const innerGeo = new THREE.ConeGeometry(0.06, 1.8, 12);
  innerGeo.rotateZ(-Math.PI / 2);
  innerGeo.translate(0.9, 0, 0);

  const innerMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, // Màu trắng tinh khôi ở tâm
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  innerMesh.name = "flare_inner";
  group.add(innerMesh);

  return group;
}

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
  engine.name = "engine_glow";
  engine.position.set(-0.28, 0, 0);
  group.add(engine);

  // Thêm vệt lửa
  const flare = createExhaustFlare(0x00f5ff);
  flare.position.set(-0.28, 0, 0);
  group.add(flare);

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
    eng.name = "engine_glow";
    eng.position.set(-0.26, 0, z);
    group.add(eng);

    // Thêm vệt lửa
    const flare = createExhaustFlare(0xcc00ff);
    flare.position.set(-0.26, 0, z);
    group.add(flare);
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
    eng.name = "engine_glow";
    eng.position.set(x, 0, z);
    group.add(eng);

    // Thêm vệt lửa
    const flare = createExhaustFlare(0xffaa00);
    flare.position.set(x, 0, z);
    group.add(flare);
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
    { pos: [0, 0.3, 0], rot: [0, 0, 0] },
    { pos: [0, -0.3, 0], rot: [Math.PI, 0, 0] },
    { pos: [0.4, 0, 0], rot: [0, 0, -Math.PI / 2] },
    { pos: [-0.4, 0, 0], rot: [0, 0, Math.PI / 2] },
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

// ── Bullet (Laser) ──
export function createBullet(color = 0x00f5ff) {
  const group = new THREE.Group();

  // Core laser (dài và mỏng)
  const geo = new THREE.CylinderGeometry(0.015, 0.015, 0.85, 6);
  geo.rotateX(Math.PI / 2); // Nằm dọc theo trục Z để hàm lookAt() chĩa thẳng mũi nhọn vào Boss
  const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 4, transparent: true, opacity: 1.0 });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  // Outer glow
  const glowGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6);
  glowGeo.rotateX(Math.PI / 2);
  const glowMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  group.add(glow);

  return group;
}

// ── Explosion Particles (Tia lửa Spark 3D) ──
export function createExplosion(position, color = 0xff6600) {
  const particles = [];
  const count = 12;

  for (let i = 0; i < count; i++) {
    // Dùng khối hộp dài để tạo tia lửa văng ra thay vì khối tròn cầu
    const geo = new THREE.BoxGeometry(0.01, 0.01, 0.08 + Math.random() * 0.06);
    const mat = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.6 ? 0xffffff : color,
      emissive: color,
      emissiveIntensity: 5,
      transparent: true,
      opacity: 1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);

    // Văng 3D theo hình cầu
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const speed = 0.06 + Math.random() * 0.08;

    const velocity = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * speed,
      Math.sin(phi) * Math.sin(theta) * speed,
      Math.cos(phi) * speed
    );

    // Hướng tia lửa nhọn theo chiều đang văng tới
    mesh.lookAt(position.clone().add(velocity));

    particles.push({ mesh, velocity, rotationSpeed: null, life: 1.0 });
  }

  return particles;
}

// ── Portal (Hố Đen Vũ Trụ Siêu Thực) ──
export function createPortal(position, color = 0x6600ff) {
  const group = new THREE.Group();
  group.position.copy(position);

  // Xóa lõi Đen Tuyệt Đối vì khối đen đặc này đè lên tàu khiến người chơi tưởng tàu biến thành màu đen.

  // 1. Event Horizon Glow (Hào quang bức xạ bọc lõi) - Giờ là quả cầu rực sáng
  const glowGeo = new THREE.SphereGeometry(0.85, 32, 32);
  const glowMat = new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 5,
    transparent: true,
    opacity: 0.4, // Reduce opacity to view ships properly
    blending: THREE.AdditiveBlending, // Tạo hiệu ứng ảo ảnh
    depthWrite: false
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  group.add(glow);

  // 3. Đĩa Bồi Tụ (Accretion Disk) ngả nghiêng
  const ringGroup = new THREE.Group();

  // Đĩa ngoài cùng khổng lồ (Sương mù)
  const disk1Geo = new THREE.RingGeometry(1.0, 3.0, 64);
  const disk1Mat = new THREE.MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const disk1 = new THREE.Mesh(disk1Geo, disk1Mat);
  ringGroup.add(disk1);

  // Đĩa giữa sáng ngắt
  const disk2Geo = new THREE.RingGeometry(0.8, 2.0, 64);
  const disk2Mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const disk2 = new THREE.Mesh(disk2Geo, disk2Mat);
  ringGroup.add(disk2);

  // Vành đai ma sát rực lửa sát mép
  const disk3Geo = new THREE.TorusGeometry(0.9, 0.04, 16, 100);
  const disk3Mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const disk3 = new THREE.Mesh(disk3Geo, disk3Mat);
  ringGroup.add(disk3);

  // Xoay đĩa bồi tụ giống hố đen trong Interstellar (nghiêng X và Y)
  ringGroup.rotation.x = Math.PI / 2.5;
  ringGroup.rotation.y = Math.PI / 8;
  group.add(ringGroup);

  // 4. Các hạt ánh sáng bị hút vào (Swirling Dust)
  const particles = [];
  const pGeo = new THREE.SphereGeometry(0.04, 6, 6);
  const pMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  for (let i = 0; i < 30; i++) {
    const pMesh = new THREE.Mesh(pGeo, pMat);
    // Bố trí xa tít để hút dần vào
    pMesh.position.set(
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 6
    );
    group.add(pMesh);
    particles.push(pMesh);
  }

  // Góc của hố đen đối diện với tàu đang trôi tới
  group.rotation.y = Math.PI / 4;
  group.scale.setScalar(0.01);

  return { group, ringGroup, innerGlow: glow, particles, life: 0.8, maxLife: 0.8 };
}
export function createHealParticles(position, color = 0x00ff66) {
  const particles = [];

  // 1. Heal Pulse (Nhỏ lại cho vừa vặn)
  const ringGeo = new THREE.TorusGeometry(0.8, 0.03, 16, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.copy(position);
  ringMesh.rotation.x = Math.PI / 2;
  particles.push({ mesh: ringMesh, velocity: new THREE.Vector3(0, 0, 0), life: 1.0, isShockwave: true });

  // 2. Heal Core Flash (Nhỏ lại)
  const coreGeo = new THREE.SphereGeometry(0.8, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.position.copy(position);
  particles.push({ mesh: coreMesh, velocity: new THREE.Vector3(0, 0, 0), life: 0.6, isCoreFlash: true });

  // 3. Bong bóng khí + Dấu "+" hồi phục
  const count = 30;
  for (let i = 0; i < count; i++) {
    let mesh;
    const isPlus = i % 2 === 0; // Một nửa là dấu +, một nửa là hình cầu

    if (isPlus) {
      // Tạo dấu "+" bằng 2 Box
      const plusGroup = new THREE.Group();
      const pMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 3, transparent: true });
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.04), pMat);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.04), pMat);
      plusGroup.add(b1, b2);
      mesh = plusGroup;
    } else {
      const geo = new THREE.SphereGeometry(0.04 + Math.random() * 0.04, 8, 8);
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 3, transparent: true });
      mesh = new THREE.Mesh(geo, mat);
    }

    // Tỏa ra chân boss và bay lên
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 2.0,
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 2.0
    );
    mesh.position.copy(position).add(offset);
    if (isPlus) {
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    }

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.01,
      0.03 + Math.random() * 0.05,
      (Math.random() - 0.5) * 0.01
    );

    particles.push({
      mesh,
      velocity,
      life: 1.0 + Math.random() * 0.5,
      rotationSpeed: isPlus ? { x: Math.random() * 0.1, y: Math.random() * 0.1, z: Math.random() * 0.1 } : null
    });
  }

  return particles;
}

// ── Boss Missile (Tên lửa tầm nhiệt) ──
export function createBossMissile(startPos) {
  const group = new THREE.Group();
  group.position.copy(startPos);

  // Thân tên lửa
  const bodyGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.4, 8);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.3, metalness: 0.8 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.rotation.x = Math.PI / 2;
  group.add(body);

  // Đầu đạn (Màu đỏ cảnh báo)
  const tipGeo = new THREE.ConeGeometry(0.08, 0.15, 8);
  const tipMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const tip = new THREE.Mesh(tipGeo, tipMat);
  tip.position.z = 0.25;
  tip.rotation.x = Math.PI / 2;
  group.add(tip);

  // Đuôi lửa (Glow)
  const fireGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const fireMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });
  const fire = new THREE.Mesh(fireGeo, fireMat);
  fire.position.z = -0.25;
  group.add(fire);

  return { 
    group, 
    velocity: new THREE.Vector3(), 
    life: 3.0, 
    type: "missile",
    update: (delta, targetPos) => {
        if (!targetPos) return;
        // Logic hướng tên lửa về phía mục tiêu
        const dir = targetPos.clone().sub(group.position).normalize();
        group.position.add(dir.multiplyScalar(delta * 5)); // Tốc độ tên lửa
        group.lookAt(targetPos);
    }
  };
}

// ── Boss Laser (Tia Laze hủy diệt) ──
export function createBossLaser(startPos, endPos, color = 0xff0000) {
  const distance = startPos.distanceTo(endPos);
  const group = new THREE.Group();
  
  // Trục Laser
  const geo = new THREE.CylinderGeometry(0.15, 0.15, distance, 12);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(geo, mat);
  
  // Quay cylinder nằm ngang nối 2 điểm
  mesh.position.set(0, 0, distance / 2);
  mesh.rotation.x = Math.PI / 2;
  group.add(mesh);
  
  // Vỏ Laser (Glow to hơn)
  const shellGeo = new THREE.CylinderGeometry(0.3, 0.3, distance, 12);
  const shellMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const shell = new THREE.Mesh(shellGeo, shellMat);
  shell.position.set(0, 0, distance / 2);
  shell.rotation.x = Math.PI / 2;
  group.add(shell);

  group.position.copy(startPos);
  group.lookAt(endPos);

  return { group, mesh, shell, life: 0.6, maxLife: 0.6 };
}

// ── Laser Charge (Hiệu ứng tụ tia trước khi bắn) ──
export function createLaserCharge(position, color = 0xff0000) {
  const group = new THREE.Group();
  group.position.copy(position);

  // Lõi tụ năng lượng
  const coreGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  // Vòng tia sét/hào quang xung quanh
  const glowGeo = new THREE.SphereGeometry(0.5, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  group.add(glow);

  return { group, core, glow, life: 0.8, maxLife: 0.8 };
}

// ── Nuclear Explosion (Vụ nổ hạt nhân diện rộng) ──
export function createNukeExplosion(position) {
  const particles = [];
  
  // 1. Siêu lõi sáng (Vàng chói)
  const coreGeo = new THREE.SphereGeometry(1, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.copy(position);
  particles.push({ mesh: core, type: "nuke_core", life: 1.0 });

  // 2. Vòng shockwave khổng lồ
  const waveGeo = new THREE.TorusGeometry(1, 0.1, 16, 100);
  const waveMat = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  const wave = new THREE.Mesh(waveGeo, waveMat);
  wave.position.copy(position);
  wave.rotation.x = Math.PI / 2;
  particles.push({ mesh: wave, type: "nuke_wave", life: 1.0 });

  return particles;
}


