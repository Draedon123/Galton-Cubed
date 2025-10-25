#!import shared

struct DrawArgs {
  indexCount: u32,
  instanceCount: atomic<u32>,
  firstIndex: u32,
  baseVertex: i32,
  firstInstance: u32,
}

@group(0) @binding(0) var <uniform> settings: PhysicsSettings;
@group(0) @binding(1) var <storage, read_write> objects: array<Object>;
@group(0) @binding(2) var <storage, read_write> ballVelocities: array<vec3f>;
@group(0) @binding(3) var <storage, read_write> heights: array<f32>;
@group(0) @binding(4) var <storage, read_write> drawArgs: DrawArgs;
@group(0) @binding(5) var <storage, read_write> ballsToDraw: array<u32>;

const RESTITUTION: f32 = 0.5;
const GRAVITY: f32 = -100.0;

@compute
@workgroup_size(64, 1, 1)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let index: u32 = id.x;
  if(index >= settings.ballCount){
    return;
  }

  let ballIndex: u32 = index + settings.pegCount;
  let deltaTime: f32 = settings.deltaTimeMs / 1000.0;
  var position: vec3f = extractPosition(objects[ballIndex].modelMatrix);

  if(position.y <= settings.bottom){
    // hack to make this run only once
    if(position.y > settings.bottom - 20.0){
      position.y = settings.bottom - 25.0;
      setPosition(&objects[ballIndex].modelMatrix, position);

      let bufferIndex: u32 = getBufferIndex(position.xz, settings.floorSideLength);
      heights[bufferIndex] += 1;
    }

    return;
  }

  let instanceCount: u32 = atomicAdd(&drawArgs.instanceCount, 1) + 1;
  ballsToDraw[instanceCount - settings.pegCount] = ballIndex;

  for(var i: u32 = 0; i < settings.pegCount; i++){
    let pegPosition: vec3f = extractPosition(objects[i].modelMatrix);
    let toPeg: vec3f = pegPosition - position;
    let collisionNormal = normalize(toPeg);
    let distanceBetweenCentres: f32 = length(toPeg);

    if(distanceBetweenCentres - settings.pegRadius - settings.ballRadius <= 0.0){
      ballVelocities[index] -= (1.0 + RESTITUTION) * collisionNormal * max(0.0, dot(collisionNormal, ballVelocities[index]));
      position = pegPosition - collisionNormal * (settings.pegRadius + settings.ballRadius);

      break;
    }
  }

  ballVelocities[index].y += 0.5 * GRAVITY * deltaTime;
  position += ballVelocities[index] * deltaTime;
  ballVelocities[index].y += 0.5 * GRAVITY * deltaTime;

  setPosition(&objects[ballIndex].modelMatrix, position);
}

fn setPosition(modelMatrix: ptr<storage, mat4x4f, read_write>, position: vec3f) {
  modelMatrix[3].x = position.x;
  modelMatrix[3].y = position.y;
  modelMatrix[3].z = position.z;
}
