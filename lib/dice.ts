import * as THREE from "three";
import * as CANNON from "cannon";
import {
  DiceD10,
  DiceD12,
  DiceD20,
  DiceD6,
  DiceD8,
  DiceManager,
  DiceOptions,
} from "@/lib/threejs-dice/dice";
import CameraControls from "camera-controls";

type Die = DiceD6 | DiceD8 | DiceD10 | DiceD12 | DiceD20;

export interface Roll {
  dice: number;
  value: number;
}

export class DiceWorldManager {
  world!: CANNON.World;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  controls!: CameraControls;
  renderer!: THREE.WebGLRenderer;
  clock!: THREE.Clock;
  interval = 1 / 60;
  delta = this.interval + 1;

  die: { dice: Die; value: number }[] = [];
  rolling = false;
  color = "#ff0000";
  textColor = "#000000";

  _beforeRoll!: (roll: { dice: number; value: number }[]) => void | undefined;

  async init(ref: HTMLDivElement) {
    if (this.scene) return;
    //Initialize the scene
    this.scene = new THREE.Scene();

    this.clock = new THREE.Clock();

    //ThreeJS camera
    const SCREEN_WIDTH = window.innerWidth,
      SCREEN_HEIGHT = window.innerHeight;

    const VIEW_ANGLE = 45,
      ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT,
      NEAR = 0.01,
      FAR = 20000;
    this.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    //this.scene.add(this.camera);
    this.camera.position.set(0, 50, 40);

    // RENDERER
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    ref.style.background = "linear-gradient(180deg, #202020 50%, #0c0c0c 100%)";
    ref.appendChild(this.renderer.domElement);

    // CONTROLS
    CameraControls.install({ THREE: THREE });
    this.controls = new CameraControls(this.camera, this.renderer.domElement);
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(80);
    this.controls.minPolarAngle = THREE.MathUtils.degToRad(15);
    this.controls.minDistance = 20;
    this.controls.maxDistance = 200;
    this.controls.truckSpeed = 0;

    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82 * 20, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 16;

    DiceManager.setWorld(this.world);

    await this._buildScene();

    window.addEventListener("resize", () => {
      var SCREEN_WIDTH = window.innerWidth,
        SCREEN_HEIGHT = window.innerHeight;
      this.renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
      this.camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
      this.camera.updateProjectionMatrix();
      this._update();
    });
    this._render();
  }
  setBeforeRoll(beforeRoll: (rolls: Roll[]) => void) {
    this._beforeRoll = beforeRoll;
  }

  setColor(color: string) {
    this.color = color;
  }
  setTextColor(color: string) {
    this.textColor = color;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.delta += this.clock.getDelta();

    if (this.delta > this.interval) {
      this._update();
      this.delta = this.delta % this.interval;
    }
  }
  _update() {
    this.world.step(this.interval);
    this.die.forEach((dice) => dice.dice.updateMeshFromBody());

    const hasToReRender = this.controls.update(this.delta);
    if (hasToReRender || this.rolling) this._render();
  }
  _render() {
    this.renderer.render(this.scene, this.camera);
  }

  async throwDice(
    roll: string | Roll[],
    options: { shouldBeforeRollRun?: boolean } = { shouldBeforeRollRun: true }
  ): Promise<
    { status: "ok"; data: Roll[] } | { status: "error"; data: string }
  > {
    if (this.rolling)
      return {
        status: "error",
        data: "There can be only one roll active at any given time",
      };
    this.rolling = true;
    //Remove thrown dice from the scene
    this.die.forEach((dice) => {
      this.scene.remove(dice.dice.getObject());
      this.world.remove(dice.dice.getObject().body);
    });
    this.die = [];
    const diceOptions: DiceOptions = {
      size: 1.5,
      backColor: this.color,
      fontColor: this.textColor,
    };

    if (typeof roll === "string") {
      const rolls = parseRoll(roll);
      if (!rolls)
        return { status: "error", data: "Couldn't parse the dice roll" };
      rolls.forEach((currentRoll) => {
        const dice = getDice(currentRoll, diceOptions);
        if (!dice)
          return { status: "error", data: "Unsupported dice: d" + currentRoll };
        this.die.push({ dice, value: randomInt(1, currentRoll) });
        this.scene.add(dice.getObject());
      });
    } else {
      roll.forEach((currentRoll) => {
        if (isNaN(currentRoll.dice) || isNaN(currentRoll.value))
          return { status: "error", data: "Couldn't parse the dice roll" };
        const dice = getDice(currentRoll.dice, diceOptions);
        if (!dice)
          return {
            status: "error",
            data: "Unsupported dice: d" + currentRoll.dice,
          };
        this.die.push({ dice, value: currentRoll.value });
        this.scene.add(dice.getObject());
      });
    }

    options?.shouldBeforeRollRun &&
      this._beforeRoll &&
      this._beforeRoll(
        this.die.map((dice) => ({
          dice: dice.dice.getFaceCount(),
          value: dice.value,
        }))
      );
    this.die.forEach((dice, i) => {
      let yRand = Math.random() * 20;
      dice.dice.getObject().position.x = -15 - (i % 3) * 1.5;
      dice.dice.getObject().position.y = 2 + Math.floor(i / 3) * 1.5;
      dice.dice.getObject().position.z = -15 + (i % 3) * 1.5;
      dice.dice.getObject().quaternion.x =
        ((Math.random() * 90 - 45) * Math.PI) / 180;
      dice.dice.getObject().quaternion.z =
        ((Math.random() * 90 - 45) * Math.PI) / 180;
      let rand = Math.random() * 5;
      dice.dice.getObject().body.velocity.set(25 + rand, 40 + yRand, 15 + rand);
      dice.dice
        .getObject()
        .body.angularVelocity.set(
          20 * Math.random() - 10,
          20 * Math.random() - 10,
          20 * Math.random() - 10
        );
      dice.dice.updateBodyFromMesh();
    });
    DiceManager.prepareValues(this.die);

    while (!this.die.every((dice) => dice.dice.isFinished())) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    this.rolling = false;

    return {
      status: "ok",
      data: this.die.map((dice) => ({
        dice: dice.dice.getFaceCount(),
        value: dice.value,
      })),
    };
  }
  async _buildScene() {
    //Lights
    const ambient = new THREE.AmbientLight("#ffffff", 0.4);
    this.scene.add(ambient);

    const light = new THREE.SpotLight("#ffffff", 1200);
    light.position.set(30, 45, 40);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.camera.near = 50;
    light.shadow.camera.far = 2000;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    this.scene.add(light);

    const loader = new THREE.TextureLoader();

    // FLOOR
    const floorMaterial = new THREE.MeshLambertMaterial({
      map: await loader.loadAsync("texture.jpg"),
      side: THREE.BackSide,
    });
    const floorGeometry = new THREE.PlaneGeometry(45, 30, 15, 10);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    floor.rotation.x = Math.PI / 2;
    this.scene.add(floor);

    const floorMaterial2 = new THREE.MeshLambertMaterial({
      map: await loader.loadAsync("metal.jpg"),
      side: THREE.FrontSide,
    });
    const floor1 = new THREE.Mesh(floorGeometry, floorMaterial2);
    floor1.receiveShadow = true;
    floor1.rotation.x = Math.PI / 2;
    floor1.position.y = -0.5;
    this.scene.add(floor1);

    //Body of the floor
    let floorBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: DiceManager.floorBodyMaterial,
    });
    floorBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI / 2
    );
    this.world.addBody(floorBody);

    //WALLS
    const wallGeometry = new THREE.BoxGeometry(45, 1, 3);
    const wallMaterial = new THREE.MeshLambertMaterial({
      map: await loader.loadAsync("metal.jpg"),
    });
    const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall1.position.z = 15.5;
    wall1.rotation.x = Math.PI / 2;
    wall1.position.y = +1;
    wall1.castShadow = true;
    wall1.receiveShadow = true;

    this.scene.add(wall1);

    const wall1Body = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(3, 50, 30)),
      material: DiceManager.barrierBodyMaterial,
      position: new CANNON.Vec3(25.5, 0, 0),
    });
    this.world.addBody(wall1Body);

    const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
    wall2.position.z = -15.5;
    wall2.rotation.x = Math.PI / 2;
    wall2.position.y = +1;
    wall2.castShadow = true;
    wall2.receiveShadow = true;
    this.scene.add(wall2);

    const wall2Body = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(3, 50, 30)),
      material: DiceManager.barrierBodyMaterial,
      position: new CANNON.Vec3(-25.5, 0, 0),
    });
    this.world.addBody(wall2Body);

    const wallGeometry2 = new THREE.BoxGeometry(32, 1, 3);
    const wall3 = new THREE.Mesh(wallGeometry2, wallMaterial);
    wall3.position.x = 23;
    wall3.rotation.z = Math.PI / 2;
    wall3.rotation.x = Math.PI / 2;
    wall3.position.y = +1;
    wall3.castShadow = true;
    wall3.receiveShadow = true;
    this.scene.add(wall3);

    const wall3Body = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(45, 50, 3)),
      material: DiceManager.barrierBodyMaterial,
      position: new CANNON.Vec3(0, 0, -18),
    });
    this.world.addBody(wall3Body);

    const wall4 = new THREE.Mesh(wallGeometry2, wallMaterial);
    wall4.position.x = -23;
    wall4.rotation.z = Math.PI / 2;
    wall4.rotation.x = Math.PI / 2;
    wall4.position.y = +1;
    wall4.castShadow = true;
    wall4.receiveShadow = true;
    this.scene.add(wall4);

    const wall4Body = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(45, 50, 3)),
      material: DiceManager.barrierBodyMaterial,
      position: new CANNON.Vec3(0, 0, 18),
    });
    this.world.addBody(wall4Body);

    this.scene.fog = new THREE.FogExp2(0x9999ff, 0.00025);
  }
}

const getDice = (faces: number, options: DiceOptions) => {
  switch (faces) {
    case 6:
      return new DiceD6(options);
    case 8:
      return new DiceD8(options);
    case 10:
      return new DiceD10(options);
    case 12:
      return new DiceD12(options);
    case 20:
      return new DiceD20(options);
    default:
      return undefined;
  }
};

const parseRoll = (roll: string) => {
  const parts = roll.split(" ");
  if (parts[0] !== "cl") {
    return parts.reduce((acc, roll) => {
      const [amount, dice] = roll.split("d").map((el) => parseInt(el));
      if (roll.split("d")[0] === "" && !isNaN(dice)) return acc.concat([dice]);
      else if (isNaN(amount) || isNaN(dice)) return acc;
      return acc.concat(new Array(amount).fill(dice));
    }, [] as number[]);
  }
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
