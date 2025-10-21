#!import balls

struct Settings {
  deltaTimeMs: f32,
  pegCount: u32,
  pegRadius: f32,
  ballRadius: f32,
}

struct BallState {
  @align(16) acceleration: vec3f,
  @align(16) velocity: vec3f,
}

@group(0) @binding(0) var <storage> settings: Settings;
@group(0) @binding(1) var <storage, read_write> balls: Balls;
@group(0) @binding(2) var <storage, read_write> ballStates: array<BallState>;

@compute
@workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let index: u32 = id.x + 8 * id.y;
  if(index + settings.pegCount > balls.count){
    return;
  }

  let deltaTime: f32 = settings.deltaTimeMs / 1000.0;
  var position: vec3f = extractPosition(&balls.balls[index + settings.pegCount].modelMatrix);

  for(var i: u32 = 0; i < settings.pegCount; i++){
    let pegPosition: vec3f = extractPosition(&balls.balls[i].modelMatrix);
    let toPeg: vec3f = pegPosition - position;
    let distanceBetweenCentres: f32 = length(toPeg);

    if(distanceBetweenCentres - settings.pegRadius - settings.ballRadius < 1e-2){
      ballStates[index].velocity = -0.9 * normalize(toPeg) * length(ballStates[index].velocity);

      break;
    }
  }

  ballStates[index].acceleration.y = -2000.0 * deltaTime;
  ballStates[index].velocity += ballStates[index].acceleration * deltaTime;
  position += ballStates[index].velocity * deltaTime;

  setPosition(&balls.balls[index + settings.pegCount].modelMatrix, position);
}

fn extractPosition(modelMatrix: ptr<storage, mat4x4f, read_write>) -> vec3f {
  return modelMatrix[3].xyz;
}

fn setPosition(modelMatrix: ptr<storage, mat4x4f, read_write>, position: vec3f) {
  modelMatrix[3].x = position.x;
  modelMatrix[3].y = position.y;
  modelMatrix[3].z = position.z;
}
