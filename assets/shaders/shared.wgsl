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
}

fn extractPosition(modelMatrix: mat4x4f) -> vec3f {
  return modelMatrix[3].xyz;
}

fn getTexturePosition(position: vec2f, floorSideLength: f32, textureSize: vec2u) -> vec2u {
  return vec2u((0.5 + position / floorSideLength) * vec2f(textureSize));
}
