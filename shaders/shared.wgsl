struct Object {
  modelMatrix: mat4x4f,
  @align(16) colour: vec3f,
}

struct PhysicsSettings {
  deltaTimeMs: f32,
  pegCount: u32,
  pegRadius: f32,
  ballRadius: f32,
  ballCount: u32,
  bottom: f32,
  floorSideLength: f32,
  lastLayer: f32,
}

fn extractPosition(modelMatrix: mat4x4f) -> vec3f {
  return modelMatrix[3].xyz;
}

fn getBufferIndex(position: vec2f, floorSideLength: f32) -> u32 {
  let gridPosition: vec2u = vec2u(vec2f(floorSideLength * (0.5 + position / floorSideLength)));

  return gridPosition.x + gridPosition.y * u32(floorSideLength);
}
