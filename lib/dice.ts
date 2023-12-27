import * as THREE from "three";
import * as CANNON from "cannon";
import { DiceD10, DiceD12, DiceD20, DiceD6, DiceD8, DiceManager, DiceOptions } from "@/lib/threejs-dice/dice";
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
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
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
    DiceManager.setInterval(this.interval);

    await this._buildScene();

    window.addEventListener("resize", () => {
      const SCREEN_WIDTH = window.innerWidth,
        SCREEN_HEIGHT = window.innerHeight;
      this.renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
      this.camera.aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
      this.camera.updateProjectionMatrix();
      this.renderer.render(this.scene, this.camera);
    });

    this.renderer.render(this.scene, this.camera);
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

    //Limit framerate to interval (60)
    if (this.delta > this.interval) {
      //Calculate next step of the simulation using same dt as in emulation to ensure same result
      this.world.step(this.interval);
      //Update meshes of dice
      this.die.forEach((dice) => dice.dice.updateMeshFromBody());
      //Update controls
      const hasToReRender = this.controls.update(this.delta);
      //Render the scene again if controls has changed or dice have been thrown
      if (hasToReRender || this.rolling) this.renderer.render(this.scene, this.camera);

      this.delta = this.delta - this.interval;
    }
  }

  async throwDice(
    roll: string | Roll[],
    options: {
      shouldBeforeRollRun?: boolean;
      diceColor?: string;
      diceTextColor?: string;
    } = { shouldBeforeRollRun: true },
  ): Promise<{ status: "ok"; data: Roll[] } | { status: "error"; data: string }> {
    if (this.rolling) {
      return {
        status: "error",
        data: "There can be only one roll active at any given time",
      };
    }
    this.rolling = true;
    //Remove previously thrown dice from the scene
    this.die.forEach((dice) => {
      this.scene.remove(dice.dice.getObject());
      this.world.remove(dice.dice.getObject().body);
    });
    this.die = [];
    const diceOptions: DiceOptions = {
      size: 1.5,
      backColor: options.diceColor ?? this.color,
      fontColor: options.diceTextColor ?? this.textColor,
    };

    if (typeof roll === "string") {
      //Roll is a string that needs to be parsed
      const parsedRoll = parseRoll(roll);

      if (parsedRoll.status === "error") {
        this.rolling = false;
        return { status: "error", data: parsedRoll.data };
      }

      parsedRoll.data.forEach((currentRoll) => {
        const dice = getDice(currentRoll, diceOptions);

        this.die.push({ dice, value: randomInt(1, currentRoll) });
        this.scene.add(dice.getObject());
      });
    } else {
      //Roll is supplied with pre-set values, parse the roll to see if there are any errors
      const parsedRoll = parseRoll(roll);
      if (parsedRoll.status === "error") {
        this.rolling = false;
        return { status: "error", data: parsedRoll.data };
      }

      roll.forEach((currentRoll) => {
        const dice = getDice(currentRoll.dice, diceOptions);

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
        })),
      );

    this.die.forEach((dice, i) => {
      const multiplier = i % 2 === 0 ? 1 : -1;
      const diceSize = 3.5;
      //Spawn the dice in a grid so there are fewer collisions at the beginning
      dice.dice.getObject().position.set(
        -22.5, //x
        10 + Math.floor(i / 10) * diceSize, //y
        multiplier * (i % 5) * diceSize + multiplier * (diceSize / 2), //z
      );
      dice.dice.getObject().quaternion.set(
        ((Math.random() * 90 - 45) * Math.PI) / 180, //x
        0, //y
        ((Math.random() * 90 - 45) * Math.PI) / 180, //z
        0, //w
      );
      dice.dice.getObject().body.velocity.set(15 * Math.random() + 15, 10 * Math.random() + 5, 5 * Math.random() + 2.5);
      dice.dice
        .getObject()
        .body.angularVelocity.set(20 * Math.random() - 10, 20 * Math.random() - 10, 20 * Math.random() - 10);
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
    const ambient = new THREE.AmbientLight("#ffffff", 0.3);
    this.scene.add(ambient);

    const light = new THREE.SpotLight("#ffffff", 1300);
    light.position.set(30, 45, 40);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.camera.near = 50;
    light.shadow.camera.far = 2000;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    this.scene.add(light);

    const loader = new THREE.TextureLoader();

    // Floor
    const floorMaterial = new THREE.MeshLambertMaterial({
      map: await loader.loadAsync("textures/fabric.webp"),
      normalMap: await loader.loadAsync("textures/fabric_normal.webp"),
      color: "#8b9b84",
      side: THREE.DoubleSide,
    });
    const floorGeometry = new THREE.PlaneGeometry(45, 30, 15, 10);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    floor.rotation.x = Math.PI / 2;
    this.scene.add(floor);
    const floor1 = new THREE.Mesh(floorGeometry, floorMaterial);
    floor1.receiveShadow = true;
    floor1.rotation.x = Math.PI / 2;
    floor1.position.y = -0.5;
    this.scene.add(floor1);

    //Body of the floor in the physics simulation
    const floorBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: DiceManager.floorBodyMaterial,
    });
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.world.addBody(floorBody);

    //Walls and their equivalent bodies
    const wallGeometry = new THREE.BoxGeometry(45, 1, 3);
    const wallMaterial = new THREE.MeshLambertMaterial({
      map: await loader.loadAsync("textures/wood.webp"),
      normalMap: await loader.loadAsync("textures/wood_normal.webp"),
      color: "#c1b2a2",
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
  }
}

const allowedDie = [6, 8, 10, 12, 20];

const getDice = (faces: number, options: DiceOptions): Die => {
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
      return new DiceD6(options);
  }
};

const parseRoll = (roll: string | Roll[]): { status: "error"; data: string } | { status: "ok"; data: number[] } => {
  let rolls: number[];
  if (typeof roll === "string") {
    const parts = roll.split(" ");

    rolls = parts.reduce((acc, roll) => {
      const [amount, dice] = roll.split("d").map((el) => parseInt(el));
      //eg. d6
      if (roll.split("d")[0] === "" && !isNaN(dice)) return acc.concat([dice]);
      //Unvalid string
      else if (isNaN(amount) || isNaN(dice)) return acc;
      //eg. 2d6
      return acc.concat(new Array(amount).fill(dice));
    }, [] as number[]);
  } else {
    rolls = roll.filter((dice) => !isNaN(dice.dice) && !isNaN(dice.value)).map((dice) => dice.dice);
  }

  if (rolls.length === 0) return { status: "error", data: "Couldn't parse the dice roll" };
  if (rolls.length > 100) return { status: "error", data: "The maximun number of die is 100" };
  const unAllowed = rolls.find((dice) => !allowedDie.includes(dice));
  if (unAllowed) return { status: "error", data: "Unsupported dice: d" + unAllowed };
  return { status: "ok", data: rolls };
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
