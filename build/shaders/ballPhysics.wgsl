#!import objects

struct Settings {
  deltaTimeMs: f32,
  pegCount: u32,
  pegRadius: f32,
  ballRadius: f32,
}

@group(0) @binding(0) var <storage> settings: Settings;
@group(0) @binding(1) var <storage, read_write> balls: Objects;
@group(0) @binding(2) var <storage, read_write> ballVelocities: array<vec3f>;

const RESTITUTION: f32 = 0.5;
const BOTTOM: f32 = -100.0;
const GRAVITY: f32 = -100.0;

@compute
@workgroup_size(64, 1, 1)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let index: u32 = id.x;
  let ballIndex: u32 = index + settings.pegCount;
  if(ballIndex >= balls.count){
    return;
  }

  let deltaTime: f32 = settings.deltaTimeMs / 1000.0;
  var position: vec3f = extractPosition(&balls.objects[ballIndex].modelMatrix);

  if(position.y <= BOTTOM){
    position.y = BOTTOM;
    setPosition(&balls.objects[ballIndex].modelMatrix, position);

    return;
  }

  for(var i: u32 = 0; i < settings.pegCount; i++){
    let pegPosition: vec3f = extractPosition(&balls.objects[i].modelMatrix);
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

  if(position.y < -100){
    position.y = -100;
    ballVelocities[index] = vec3f(0.0);
  }

  setPosition(&balls.objects[ballIndex].modelMatrix, position);
}

fn extractPosition(modelMatrix: ptr<storage, mat4x4f, read_write>) -> vec3f {
  return modelMatrix[3].xyz;
}

fn setPosition(modelMatrix: ptr<storage, mat4x4f, read_write>, position: vec3f) {
  modelMatrix[3].x = position.x;
  modelMatrix[3].y = position.y;
  modelMatrix[3].z = position.z;
}
