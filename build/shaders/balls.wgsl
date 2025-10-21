struct Balls {
  @align(16) count: u32,
  balls: array<Ball>,
}

struct Ball {
  modelMatrix: mat4x4f,
  @align(16) colour: vec3f,
}
