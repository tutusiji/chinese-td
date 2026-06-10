import * as THREE from 'three';
import { EnemyType, TowerType, TerrainType } from '../types/game';

// ─── 共享几何体缓存 (避免每帧创建) ──────────────────────

const GEO = {
  sphere05: new THREE.SphereGeometry(0.05, 8, 6),
  sphere06: new THREE.SphereGeometry(0.06, 8, 6),
  sphere08: new THREE.SphereGeometry(0.08, 12, 8),
  cylinderArm: new THREE.CylinderGeometry(0.02, 0.025, 0.14, 6),
  cylinderLeg: new THREE.CylinderGeometry(0.025, 0.022, 0.16, 6),
  cylinderBody: new THREE.CylinderGeometry(0.06, 0.07, 0.22, 8),
  boxSword: new THREE.BoxGeometry(0.015, 0.16, 0.01),
  cylinderSpear: new THREE.CylinderGeometry(0.008, 0.008, 0.28, 6),
  coneSpearTip: new THREE.ConeGeometry(0.014, 0.05, 6),
  cylinderHorseLeg: new THREE.CylinderGeometry(0.02, 0.022, 0.15, 6),
  boxHorseBody: new THREE.BoxGeometry(0.13, 0.1, 0.25),
  coneHorseHead: new THREE.ConeGeometry(0.05, 0.12, 6),
  // 塔
  cylinderPillar: new THREE.CylinderGeometry(0.08, 0.09, 0.4, 8),
  cylinderPillarL2: new THREE.CylinderGeometry(0.09, 0.1, 0.52, 8),
  cylinderPillarL3: new THREE.CylinderGeometry(0.1, 0.12, 0.65, 8),
  boxBase: new THREE.BoxGeometry(0.34, 0.1, 0.34),
  boxPlatform: new THREE.BoxGeometry(0.26, 0.04, 0.26),
  coneRoof: new THREE.ConeGeometry(0.18, 0.2, 4),
  coneRoofL2: new THREE.ConeGeometry(0.21, 0.24, 4),
  coneRoofL3: new THREE.ConeGeometry(0.25, 0.28, 4),
  // 炮台
  cylinderBarrel: new THREE.CylinderGeometry(0.03, 0.04, 0.25, 8),
  cylinderBarrelL2: new THREE.CylinderGeometry(0.04, 0.05, 0.3, 8),
  cylinderBarrelL3: new THREE.CylinderGeometry(0.05, 0.065, 0.36, 8),
  boxBreech: new THREE.BoxGeometry(0.06, 0.07, 0.08),
  boxBreechL2: new THREE.BoxGeometry(0.07, 0.08, 0.09),
  boxBreechL3: new THREE.BoxGeometry(0.08, 0.09, 0.1),
  // 冰塔
  octaCrystal: new THREE.OctahedronGeometry(0.08, 0),
  octaCrystalL2: new THREE.OctahedronGeometry(0.1, 0),
  octaCrystalL3: new THREE.OctahedronGeometry(0.12, 0),
  coneSpike: new THREE.ConeGeometry(0.015, 0.08, 4),
  // 城堡
  boxCastleBase: new THREE.BoxGeometry(1.5, 0.9, 1.5),
  boxBattlement: new THREE.BoxGeometry(0.12, 0.1, 0.12),
  boxGate: new THREE.BoxGeometry(0.3, 0.4, 0.06),
  cylinderFlagPole: new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6),
  // 子弹
  cylinderArrowShaft: new THREE.CylinderGeometry(0.01, 0.01, 0.14, 6),
  coneArrowTip: new THREE.ConeGeometry(0.02, 0.05, 6),
  boxFletching: new THREE.BoxGeometry(0.02, 0.03, 0.005),
  // 地形
  coneMountain: new THREE.ConeGeometry(0.22, 0.55, 6),
  coneMountainSmall: new THREE.ConeGeometry(0.14, 0.35, 5),
  cylTreeTrunk: new THREE.CylinderGeometry(0.03, 0.04, 0.2, 6),
  sphereFoliage: new THREE.SphereGeometry(0.1, 6, 4),
  coneFoliage: new THREE.ConeGeometry(0.1, 0.18, 6),
  boxGrassBlade: new THREE.BoxGeometry(0.015, 0.08, 0.005),
  planeRiver: new THREE.PlaneGeometry(1.02, 1.02),
};

// ─── 材质工厂 ────────────────────────────────────────────

function mat(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.75,
    metalness: opts.metalness ?? 0.05,
    ...opts,
  });
}

function iceMat(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0x7ec8f8,
    roughness: 0.15,
    metalness: 0.1,
    clearcoat: 0.1,
    transparent: true,
    opacity: 0.85,
  });
}

// ─── 敌兵颜色 ────────────────────────────────────────────

const ENEMY_COLORS: Record<EnemyType, { body: number; head: number; weapon: number; dark: number }> = {
  sword: { body: 0xd4a574, head: 0xe8c9a0, weapon: 0x888888, dark: 0x5a3a2a },
  spear: { body: 0xc43a31, head: 0xe8c9a0, weapon: 0x8b6914, dark: 0x662222 },
  horse: { body: 0x8b6914, head: 0xe8c9a0, weapon: 0x6b5a4a, dark: 0x4a3020 },
};

// ─── 模型构建 ────────────────────────────────────────────

export class ModelFactory {
  // ═══════════════════════════════════════════════════════
  // 敌兵
  // ═══════════════════════════════════════════════════════

  static createEnemy(type: EnemyType): THREE.Group {
    if (type === 'horse') return this.createCavalry();
    return this.createInfantry(type);
  }

  private static createInfantry(type: EnemyType): THREE.Group {
    const root = new THREE.Group();
    root.name = 'model';
    const clr = ENEMY_COLORS[type];

    // body Group — 所有可动部件挂载于此 (death 动画会影响整个身体)
    const bodyGroup = new THREE.Group();
    bodyGroup.name = 'body';
    root.add(bodyGroup);

    // --- torso ---
    const torso = new THREE.Mesh(GEO.cylinderBody, mat(clr.body));
    torso.name = 'torso';
    torso.position.y = 0.22;
    bodyGroup.add(torso);

    // --- head ---
    const head = new THREE.Mesh(GEO.sphere06, mat(clr.head));
    head.name = 'head';
    head.position.y = 0.38;
    bodyGroup.add(head);

    // 头盔 (小锥体)
    const helmet = new THREE.Mesh(
      new THREE.ConeGeometry(0.05, 0.06, 6),
      mat(clr.dark, { roughness: 0.6, metalness: 0.3 }),
    );
    helmet.position.y = 0.43;
    bodyGroup.add(helmet);

    // 眼睛 (两个小点)
    const eyeGeo = new THREE.SphereGeometry(0.008, 4, 4);
    const eyeMat = mat(0x111111);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.02, 0.39, 0.05);
    bodyGroup.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.02, 0.39, 0.05);
    bodyGroup.add(rightEye);

    // --- left arm ---
    const leftArmPivot = new THREE.Group();
    leftArmPivot.name = 'leftArm';
    leftArmPivot.position.set(-0.08, 0.28, 0);
    const leftArm = new THREE.Mesh(GEO.cylinderArm, mat(clr.body, { roughness: 0.8 }));
    leftArm.position.y = -0.07;
    leftArmPivot.add(leftArm);
    // 盾牌 (步兵)
    if (type === 'sword') {
      const shield = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.01, 8),
        mat(0x8b6914, { roughness: 0.6, metalness: 0.3 }),
      );
      shield.position.set(0.03, -0.05, 0.04);
      shield.rotation.x = Math.PI / 2;
      leftArmPivot.add(shield);
    }
    bodyGroup.add(leftArmPivot);

    // --- right arm ---
    const rightArmPivot = new THREE.Group();
    rightArmPivot.name = 'rightArm';
    rightArmPivot.position.set(0.08, 0.28, 0);
    const rightArm = new THREE.Mesh(GEO.cylinderArm, mat(clr.body, { roughness: 0.8 }));
    rightArm.position.y = -0.07;
    rightArmPivot.add(rightArm);
    if (type === 'sword') {
      const sword = new THREE.Mesh(GEO.boxSword, mat(0xcccccc, { metalness: 0.7 }));
      sword.position.set(0.03, -0.09, 0.04);
      rightArmPivot.add(sword);
    }
    if (type === 'spear') {
      const shaft = new THREE.Mesh(GEO.cylinderSpear, mat(0x8b6914));
      shaft.position.set(0.02, -0.1, 0.05);
      rightArmPivot.add(shaft);
      const tip = new THREE.Mesh(GEO.coneSpearTip, mat(0xcccccc, { metalness: 0.8 }));
      tip.position.set(0.02, 0.06, 0.05);
      rightArmPivot.add(tip);
    }
    bodyGroup.add(rightArmPivot);

    // --- left leg ---
    const leftLegPivot = new THREE.Group();
    leftLegPivot.name = 'leftLeg';
    leftLegPivot.position.set(-0.03, 0.1, 0);
    const leftLeg = new THREE.Mesh(GEO.cylinderLeg, mat(clr.dark));
    leftLeg.position.y = -0.08;
    leftLegPivot.add(leftLeg);
    bodyGroup.add(leftLegPivot);

    // --- right leg ---
    const rightLegPivot = new THREE.Group();
    rightLegPivot.name = 'rightLeg';
    rightLegPivot.position.set(0.03, 0.1, 0);
    const rightLeg = new THREE.Mesh(GEO.cylinderLeg, mat(clr.dark));
    rightLeg.position.y = -0.08;
    rightLegPivot.add(rightLeg);
    bodyGroup.add(rightLegPivot);

    // --- ground shadow ---
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.09, 8),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }),
    );
    shadow.name = 'shadow';
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    root.add(shadow);

    return root;
  }

  private static createCavalry(): THREE.Group {
    const root = new THREE.Group();
    root.name = 'model';
    const clr = ENEMY_COLORS.horse;

    // body Group — 所有动画对象挂载于此
    const body = new THREE.Group();
    body.name = 'body';
    root.add(body);

    // --- horse body ---
    const horseBody = new THREE.Mesh(GEO.boxHorseBody, mat(0x6b4a30));
    horseBody.name = 'horseBody';
    horseBody.position.y = 0.22;
    body.add(horseBody);

    // horse head
    const horseHead = new THREE.Mesh(GEO.coneHorseHead, mat(0x4a3020));
    horseHead.name = 'horseHead';
    horseHead.rotation.x = -0.5;
    horseHead.position.set(0, 0.22, 0.16);
    body.add(horseHead);

    // 马眼
    const horseEyeGeo = new THREE.SphereGeometry(0.008, 4, 4);
    const horseEyeMat = mat(0x111111);
    const he1 = new THREE.Mesh(horseEyeGeo, horseEyeMat);
    he1.position.set(0.025, 0.23, 0.19);
    body.add(he1);
    const he2 = new THREE.Mesh(horseEyeGeo, horseEyeMat);
    he2.position.set(-0.025, 0.23, 0.19);
    body.add(he2);

    // 尾巴
    const tail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.02, 0.14, 6),
      mat(0x3a1f10),
    );
    tail.position.set(0, 0.24, -0.14);
    tail.rotation.x = 0.6;
    body.add(tail);

    // horse legs (4个)
    const legPositions: [string, number, number][] = [
      ['legFL', -0.05, 0.1], ['legFR', 0.05, 0.1],
      ['legBL', -0.05, -0.1], ['legBR', 0.05, -0.1],
    ];
    for (const [name, lx, lz] of legPositions) {
      const legPivot = new THREE.Group();
      legPivot.name = name;
      legPivot.position.set(lx, 0.14, lz);
      const leg = new THREE.Mesh(GEO.cylinderHorseLeg, mat(0x3a1f10));
      leg.position.y = -0.07;
      legPivot.add(leg);
      // 马蹄
      const hoof = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.03, 0.025),
        mat(0x1a0a00, { roughness: 0.9 }),
      );
      hoof.position.y = -0.14;
      legPivot.add(hoof);
      body.add(legPivot);
    }

    // --- rider (简化上半身) ---
    const riderBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.06, 0.15, 8),
      mat(clr.body),
    );
    riderBody.name = 'riderBody';
    riderBody.position.y = 0.35;
    body.add(riderBody);

    const riderHead = new THREE.Mesh(GEO.sphere06, mat(clr.head));
    riderHead.name = 'riderHead';
    riderHead.position.y = 0.48;
    body.add(riderHead);

    // rider arm with weapon
    const riderArmPivot = new THREE.Group();
    riderArmPivot.name = 'rightArm';
    riderArmPivot.position.set(0.08, 0.38, 0);
    const riderArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.022, 0.12, 6),
      mat(clr.body, { roughness: 0.8 }),
    );
    riderArm.position.y = -0.06;
    riderArmPivot.add(riderArm);
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.13, 0.008),
      mat(0xcccccc, { metalness: 0.7 }),
    );
    blade.position.set(0.02, -0.08, 0.04);
    riderArmPivot.add(blade);
    body.add(riderArmPivot);

    // shadow
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.13, 8),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }),
    );
    shadow.name = 'shadow';
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    root.add(shadow);

    return root;
  }

  // ═══════════════════════════════════════════════════════
  // 防御塔
  // ═══════════════════════════════════════════════════════

  static createTower(type: TowerType, level: number = 1): THREE.Group {
    switch (type) {
      case 'cannon': return this.createCannonTower(level);
      case 'ice': return this.createIceTower(level);
      default: return this.createArrowTower(level);
    }
  }

  private static createArrowTower(level: number): THREE.Group {
    const root = new THREE.Group();
    root.name = 'model';

    const colorBase = 0x6b5a4a;
    const colorAccent = 0xc8a03c;
    const colorRoof = 0x244b6e;
    const pillarGeo = level >= 3 ? GEO.cylinderPillarL3 : level >= 2 ? GEO.cylinderPillarL2 : GEO.cylinderPillar;
    const roofGeo = level >= 3 ? GEO.coneRoofL3 : level >= 2 ? GEO.coneRoofL2 : GEO.coneRoof;

    // base
    const base = new THREE.Mesh(GEO.boxBase, mat(colorBase, { roughness: 0.9 }));
    base.name = 'base';
    base.position.y = 0.05;
    root.add(base);

    // pillar
    const pillar = new THREE.Mesh(pillarGeo, mat(colorBase, { roughness: 0.85 }));
    pillar.name = 'pillar';
    pillar.position.y = 0.3;
    root.add(pillar);

    // platform
    const platform = new THREE.Mesh(GEO.boxPlatform, mat(colorAccent, { roughness: 0.7, metalness: 0.2 }));
    platform.name = 'platform';
    platform.position.y = 0.55 + (level - 1) * 0.06;
    root.add(platform);

    // bow (two arcs)
    const bowLeft = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.01, 6, 6, Math.PI),
      mat(colorAccent, { roughness: 0.6, metalness: 0.3 }),
    );
    bowLeft.name = 'bowLeft';
    bowLeft.position.set(0, 0.62 + (level - 1) * 0.06, 0.12);
    bowLeft.rotation.set(0, 0, -0.4);
    root.add(bowLeft);

    const bowRight = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.01, 6, 6, Math.PI),
      mat(colorAccent, { roughness: 0.6, metalness: 0.3 }),
    );
    bowRight.name = 'bowRight';
    bowRight.position.set(0, 0.62 + (level - 1) * 0.06, 0.12);
    bowRight.rotation.set(0, 0, 0.4);
    bowRight.scale.x = -1;
    root.add(bowRight);

    // roof
    const roof = new THREE.Mesh(roofGeo, mat(colorRoof, { roughness: 0.7 }));
    roof.name = 'roof';
    roof.position.y = 0.68 + (level - 1) * 0.06;
    roof.rotation.y = Math.PI / 4; // 四角锥旋转以对齐方形底座
    root.add(roof);

    // level 2+ extra spire
    if (level >= 2) {
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(0.03, 0.08, 4),
        mat(colorAccent, { metalness: 0.4 }),
      );
      spire.name = 'spire';
      spire.position.y = 0.82 + (level - 1) * 0.06;
      root.add(spire);
    }

    // 旗帜
    const flagPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.18, 6),
      mat(0x5a3a2a),
    );
    flagPole.position.set(0, 0.72 + (level - 1) * 0.06, 0);
    root.add(flagPole);
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.06, 0.04),
      new THREE.MeshStandardMaterial({
        color: 0xc43a31, roughness: 0.6, side: THREE.DoubleSide,
      }),
    );
    flag.name = 'flag';
    flag.position.set(0.035, 0.8 + (level - 1) * 0.06, 0);
    root.add(flag);

    // shadow
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.18, 8),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false }),
    );
    shadow.name = 'shadow';
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    root.add(shadow);

    return root;
  }

  private static createCannonTower(level: number): THREE.Group {
    const root = new THREE.Group();
    root.name = 'model';

    const colorBase = 0x5a4a3a;
    const colorMetal = 0x3a3a3a;
    const barrelGeo = level >= 3 ? GEO.cylinderBarrelL3 : level >= 2 ? GEO.cylinderBarrelL2 : GEO.cylinderBarrel;
    const breechGeo = level >= 3 ? GEO.boxBreechL3 : level >= 2 ? GEO.boxBreechL2 : GEO.boxBreech;

    // heavy base
    const base = new THREE.Mesh(
      level >= 2 ? new THREE.BoxGeometry(0.4, 0.12, 0.4) : GEO.boxBase,
      mat(colorBase, { roughness: 0.9 }),
    );
    base.name = 'base';
    base.position.y = 0.06;
    root.add(base);

    // body / turret
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 0.22, 8),
      mat(colorMetal, { roughness: 0.6, metalness: 0.5 }),
    );
    body.name = 'body';
    body.position.y = 0.2;
    root.add(body);

    // barrel - pointing right (forward in 3D view)
    const barrel = new THREE.Mesh(barrelGeo, mat(colorMetal, { roughness: 0.5, metalness: 0.6 }));
    barrel.name = 'barrel';
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.14, 0.28, 0);
    root.add(barrel);

    // breech
    const breech = new THREE.Mesh(breechGeo, mat(colorMetal, { roughness: 0.5, metalness: 0.6 }));
    breech.name = 'breech';
    breech.position.set(-0.04, 0.28, 0);
    root.add(breech);

    // 弹药箱
    const ammoBox1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.05, 0.08),
      mat(0x5a4a30, { roughness: 0.85 }),
    );
    ammoBox1.position.set(0.16, 0.07, 0.1);
    root.add(ammoBox1);
    const ammoBox2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.04, 0.06),
      mat(0x5a4a30, { roughness: 0.85 }),
    );
    ammoBox2.position.set(0.18, 0.05, -0.08);
    root.add(ammoBox2);

    // level 3 extra: support struts
    if (level >= 3) {
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const strut = new THREE.Mesh(
          new THREE.CylinderGeometry(0.015, 0.02, 0.15, 6),
          mat(colorBase, { roughness: 0.8 }),
        );
        strut.position.set(Math.cos(angle) * 0.1, 0.15, Math.sin(angle) * 0.1);
        strut.rotation.z = Math.cos(angle) * 0.5;
        strut.rotation.x = Math.sin(angle) * 0.5;
        root.add(strut);
      }
    }

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.2, 8),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false }),
    );
    shadow.name = 'shadow';
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    root.add(shadow);

    return root;
  }

  private static createIceTower(level: number): THREE.Group {
    const root = new THREE.Group();
    root.name = 'model';

    const crystalGeo = level >= 3 ? GEO.octaCrystalL3 : level >= 2 ? GEO.octaCrystalL2 : GEO.octaCrystal;

    // base
    const base = new THREE.Mesh(GEO.boxBase, mat(0x3a5a6a, { roughness: 0.8 }));
    base.name = 'base';
    base.position.y = 0.05;
    root.add(base);

    // pillar
    const pillar = new THREE.Mesh(GEO.cylinderPillar, mat(0x4a7a8a, { roughness: 0.7 }));
    pillar.name = 'pillar';
    pillar.position.y = 0.28;
    root.add(pillar);

    // crystal core
    const crystal = new THREE.Mesh(crystalGeo, iceMat());
    crystal.name = 'crystal';
    crystal.position.y = 0.55 + (level - 1) * 0.04;
    root.add(crystal);

    // orbiting small shards
    const shardCount = 3 + level;
    for (let i = 0; i < shardCount; i++) {
      const angle = (i / shardCount) * Math.PI * 2;
      const shard = new THREE.Mesh(GEO.coneSpike, iceMat());
      shard.name = `shard${i}`;
      shard.position.set(
        Math.cos(angle) * 0.12,
        0.55 + Math.sin(i * 1.3) * 0.03,
        Math.sin(angle) * 0.12,
      );
      shard.rotation.set(Math.cos(angle) * 0.6, 0, Math.sin(angle) * 0.6);
      root.add(shard);
    }

    // ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.015, 8, 12),
      mat(0x9fd8ff, { roughness: 0.3, metalness: 0.3, transparent: true, opacity: 0.6 }),
    );
    ring.name = 'ring';
    ring.position.y = 0.42;
    root.add(ring);

    // 地面冰霜扩散
    const frostGround = new THREE.Mesh(
      new THREE.CircleGeometry(0.15, 8),
      new THREE.MeshBasicMaterial({
        color: 0x9fd8ff, transparent: true, opacity: 0.18, depthWrite: false,
      }),
    );
    frostGround.name = 'frostGround';
    frostGround.rotation.x = -Math.PI / 2;
    frostGround.position.y = 0.01;
    root.add(frostGround);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.16, 8),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false }),
    );
    shadow.name = 'shadow';
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    root.add(shadow);

    return root;
  }

  // ═══════════════════════════════════════════════════════
  // 城堡
  // ═══════════════════════════════════════════════════════

  static createCastle(level: number = 1): THREE.Group {
    const root = new THREE.Group();
    root.name = 'model';

    const scale = 0.8 + level * 0.1;

    // main body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.55 * scale, 0.9, 1.55 * scale),
      mat(0x746455, { roughness: 0.8 }),
    );
    body.name = 'body';
    body.position.y = 0.45 * scale;
    root.add(body);

    // battlements along top
    const battlementCount = 8;
    const wallHalf = 0.75 * scale;
    for (let i = 0; i < battlementCount; i++) {
      const t = (i / battlementCount - 0.5) * 2;
      const battlement = new THREE.Mesh(
        new THREE.BoxGeometry(0.12 * scale, 0.1, 0.1 * scale),
        mat(0x8a7a65, { roughness: 0.75 }),
      );
      battlement.position.set(t * wallHalf, 0.95 * scale, wallHalf);
      root.add(battlement);

      const battlement2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.12 * scale, 0.1, 0.1 * scale),
        mat(0x8a7a65, { roughness: 0.75 }),
      );
      battlement2.position.set(t * wallHalf, 0.95 * scale, -wallHalf);
      root.add(battlement2);

      const battlement3 = new THREE.Mesh(
        new THREE.BoxGeometry(0.1 * scale, 0.1, 0.12 * scale),
        mat(0x8a7a65, { roughness: 0.75 }),
      );
      battlement3.position.set(wallHalf, 0.95 * scale, t * wallHalf);
      root.add(battlement3);

      const battlement4 = new THREE.Mesh(
        new THREE.BoxGeometry(0.1 * scale, 0.1, 0.12 * scale),
        mat(0x8a7a65, { roughness: 0.75 }),
      );
      battlement4.position.set(-wallHalf, 0.95 * scale, t * wallHalf);
      root.add(battlement4);
    }

    // gate
    const gate = new THREE.Mesh(
      new THREE.BoxGeometry(0.3 * scale, 0.4, 0.06),
      mat(0x3a2a1a, { roughness: 0.9 }),
    );
    gate.name = 'gate';
    gate.position.set(0, 0.2, 0.78 * scale);
    root.add(gate);

    // roof tiers
    const roof1 = new THREE.Mesh(
      new THREE.ConeGeometry(0.9 * scale, 0.3, 4),
      mat(0x244b6e, { roughness: 0.65 }),
    );
    roof1.position.y = 1.05 * scale;
    roof1.rotation.y = Math.PI / 4;
    root.add(roof1);

    const roof2 = new THREE.Mesh(
      new THREE.ConeGeometry(0.55 * scale, 0.2, 4),
      mat(0x2a5a7e, { roughness: 0.65 }),
    );
    roof2.position.y = 1.35 * scale;
    roof2.rotation.y = Math.PI / 4;
    root.add(roof2);

    // flag pole
    const flagPole = new THREE.Mesh(GEO.cylinderFlagPole, mat(0x5a3a2a));
    flagPole.name = 'flagPole';
    flagPole.position.set(0, 1.55 * scale, 0);
    root.add(flagPole);

    // flag
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.1, 0.06),
      new THREE.MeshStandardMaterial({ color: 0xc43a31, roughness: 0.6, side: THREE.DoubleSide }),
    );
    flag.name = 'flag';
    flag.position.set(0.06, 1.7 * scale, 0);
    root.add(flag);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.8 * scale, 12),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2, depthWrite: false }),
    );
    shadow.name = 'shadow';
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    root.add(shadow);

    return root;
  }

  // ═══════════════════════════════════════════════════════
  // 子弹
  // ═══════════════════════════════════════════════════════

  static createBullet(type: TowerType): THREE.Group {
    const root = new THREE.Group();
    root.name = 'model';

    switch (type) {
      case 'arrow': {
        const shaft = new THREE.Mesh(GEO.cylinderArrowShaft, mat(0x8b6914));
        shaft.name = 'shaft';
        shaft.rotation.x = Math.PI / 2;
        shaft.position.z = 0.07;
        root.add(shaft);

        const tip = new THREE.Mesh(GEO.coneArrowTip, mat(0xcccccc, { metalness: 0.8 }));
        tip.name = 'tip';
        tip.rotation.x = Math.PI / 2;
        tip.position.z = 0.16;
        root.add(tip);

        const fletching = new THREE.Mesh(GEO.boxFletching, mat(0xc43a31));
        fletching.name = 'fletching';
        fletching.position.z = -0.03;
        root.add(fletching);
        // second fletching
        const f2 = new THREE.Mesh(GEO.boxFletching, mat(0xc43a31));
        f2.rotation.y = Math.PI / 3;
        f2.position.z = -0.03;
        root.add(f2);
        break;
      }
      case 'cannon': {
        const ball = new THREE.Mesh(GEO.sphere08, mat(0x3a3a3a, { roughness: 0.4, metalness: 0.7 }));
        ball.name = 'ball';
        root.add(ball);
        break;
      }
      case 'ice': {
        const core = new THREE.Mesh(GEO.sphere08, iceMat());
        core.name = 'core';
        root.add(core);
        break;
      }
    }

    return root;
  }

  // ═══════════════════════════════════════════════════════
  // 地形
  // ═══════════════════════════════════════════════════════

  static createTerrainTile(type: TerrainType, seed: number = 0): THREE.Group {
    const root = new THREE.Group();
    root.name = 'terrain';
    // 使用确定性伪随机，避免每次重建地图都不同
    const rng = mulberry32(seed);

    switch (type) {
      case 'mountain': return ModelFactory.createMountain(rng);
      case 'tree': return ModelFactory.createTree(rng);
      case 'grass': return ModelFactory.createGrass(rng);
      case 'river': return ModelFactory.createRiver();
      default: return root;
    }
  }

  private static createMountain(rng: () => number): THREE.Group {
    const root = new THREE.Group();
    root.name = 'mountain';

    const baseColor = 0x6b7b6a;
    const rockColor = 0x5a5a52;

    // 主峰
    const peak = new THREE.Mesh(GEO.coneMountain, mat(baseColor, { roughness: 0.9 }));
    peak.name = 'peak';
    peak.position.y = 0.28;
    root.add(peak);

    // 副峰 2-4个随机偏移
    const count = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < count; i++) {
      const small = new THREE.Mesh(GEO.coneMountainSmall, mat(
        baseColor - Math.floor(rng() * 0x202020),
        { roughness: 0.85 },
      ));
      const angle = rng() * Math.PI * 2;
      const dist = 0.08 + rng() * 0.18;
      small.position.set(
        Math.cos(angle) * dist,
        0.15 + rng() * 0.15,
        Math.sin(angle) * dist,
      );
      small.rotation.z = (rng() - 0.5) * 0.3;
      small.rotation.x = (rng() - 0.5) * 0.3;
      root.add(small);
    }

    // 岩石底座
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.24, 0.06, 8),
      mat(rockColor, { roughness: 0.95 }),
    );
    base.position.y = 0.03;
    root.add(base);

    root.userData = { height: 0.62 };
    return root;
  }

  private static createTree(rng: () => number): THREE.Group {
    const root = new THREE.Group();
    root.name = 'tree';

    // 树干
    const trunk = new THREE.Mesh(GEO.cylTreeTrunk, mat(0x5a3b22, { roughness: 0.9 }));
    trunk.name = 'trunk';
    trunk.position.y = 0.1;
    root.add(trunk);

    // 3层树冠
    const foliageColors = [0x35633f, 0x2f5a34, 0x274f2e];
    for (let i = 0; i < 3; i++) {
      const foliage = new THREE.Mesh(
        i < 2 ? GEO.sphereFoliage : GEO.coneFoliage,
        mat(foliageColors[i], { roughness: 0.7 }),
      );
      foliage.position.y = 0.18 + i * 0.1;
      foliage.scale.set(
        0.9 + rng() * 0.2,
        0.8 + rng() * 0.3,
        0.9 + rng() * 0.2,
      );
      if (i === 2) foliage.position.y = 0.36;
      root.add(foliage);
    }

    root.userData = { height: 0.4 };
    return root;
  }

  private static createGrass(rng: () => number): THREE.Group {
    const root = new THREE.Group();
    root.name = 'grass';

    // 低基座
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.03, 0.9),
      mat(0x3f6a3a, { roughness: 0.9 }),
    );
    base.position.y = 0.015;
    root.add(base);

    // 随机草叶 (8-15片)
    const bladeCount = 8 + Math.floor(rng() * 8);
    for (let i = 0; i < bladeCount; i++) {
      const blade = new THREE.Mesh(GEO.boxGrassBlade, mat(
        0x5b9a3a + Math.floor(rng() * 0x334422),
        { roughness: 0.7 },
      ));
      blade.position.set(
        (rng() - 0.5) * 0.85,
        0.05 + rng() * 0.03,
        (rng() - 0.5) * 0.85,
      );
      blade.rotation.z = (rng() - 0.5) * 0.4;
      blade.rotation.x = (rng() - 0.5) * 0.4;
      root.add(blade);
    }

    root.userData = { height: 0.06 };
    return root;
  }

  private static createRiver(): THREE.Group {
    const root = new THREE.Group();
    root.name = 'river';

    // 半透明水面
    const water = new THREE.Mesh(
      GEO.planeRiver,
      new THREE.MeshStandardMaterial({
        color: 0x3388aa,
        roughness: 0.1,
        metalness: 0.3,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }),
    );
    water.name = 'water';
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.02;
    root.add(water);

    root.userData = { height: 0.04 };
    return root;
  }
}

/** 简单伪随机数生成器 (mulberry32) */
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
