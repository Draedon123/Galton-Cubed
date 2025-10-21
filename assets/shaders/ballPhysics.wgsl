#!import balls

struct Settings {
  deltaTimeMs: f32,
  indexOffset: u32,
}

@group(0) @binding(0) var <storage> settings: Settings;
@group(0) @binding(1) var <storage, read_write> balls: Balls;

@compute
@workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let index: u32 = id.x + 8 * id.y + settings.indexOffset;
  if(index > balls.count){
    return;
  }

  var position: vec3f = extractPosition(balls.balls[index].modelMatrix);

  position.y -= 0.01 * settings.deltaTimeMs;

  setPosition(&balls.balls[index].modelMatrix, position);
}

fn extractPosition(modelMatrix: mat4x4f) -> vec3f {
  return modelMatrix[3].xyz;
}

fn setPosition(modelMatrix: ptr<storage, mat4x4f, read_write>, position: vec3f) {
  modelMatrix[3].x = position.x;
  modelMatrix[3].y = position.y;
  modelMatrix[3].z = position.z;
}
