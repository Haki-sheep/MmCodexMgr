// The static parts of the preview scene: ground grid, lights, a 1.8 m
// stand-in character for scale, an invisible ground for soft particles, and
// an invisible but solid floor that hides what is below y = 0, like the
// ground of a game and of the Unity verify scene.

import * as THREE from 'three';
import { GROUND_DEPTH_LAYER, HELPER_LAYER } from './layers';

export interface StageProps {
  grid: THREE.GridHelper;
  character: THREE.Group;
}

export function buildStage(scene: THREE.Scene): StageProps {
  const grid = new THREE.GridHelper(20, 20, 0x5a5470, 0x34304a);
  grid.layers.set(HELPER_LAYER);
  scene.add(grid);
  scene.add(new THREE.HemisphereLight(0xd8d4ff, 0x302838, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(3, 6, 4);
  scene.add(sun);

  const character = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x6f6a82, roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 1.0, 6, 16), mat);
  body.position.y = 0.78;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), mat);
  head.position.y = 1.62;
  character.add(body, head);
  scene.add(character);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ colorWrite: false }));
  ground.rotation.x = -Math.PI / 2;
  ground.layers.set(GROUND_DEPTH_LAYER);
  scene.add(ground);

  // depth only, drawn before everything; seen from below it is culled
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ colorWrite: false }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.002; // under the grid lines
  floor.renderOrder = -1000;
  scene.add(floor);
  return { grid, character };
}
