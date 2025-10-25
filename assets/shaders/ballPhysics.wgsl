#!import shared

@group(0) @binding(0) var <uniform> settings: PhysicsSettings;
@group(0) @binding(1) var <storage, read_write> objects: array<Object>;
@group(0) @binding(2) var <storage, read_write> ballVelocities: array<vec3f>;

@group(1) @binding(0) var densityMapIn: texture_storage_2d<r32uint, read>;
@group(1) @binding(1) var densityMapOut: texture_storage_2d<r32uint, write>;

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

  if(position.y <= settings.bottom && position.y > -1e10){
    // hack to make this run only once
    position.y = -2e10;
    setPosition(&objects[ballIndex].modelMatrix, position);

    let texturePosition: vec2u = getTexturePosition(position.xz, settings.floorSideLength, textureDimensions(densityMapIn));
    textureStore(densityMapOut, texturePosition, vec4u(textureLoad(densityMapIn, texturePosition).r + 1));

    return;
  }

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
