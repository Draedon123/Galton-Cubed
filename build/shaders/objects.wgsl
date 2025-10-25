struct Objects {
  @align(16) count: u32,
  objects: array<Object>,
}

struct Object {
  modelMatrix: mat4x4f,
  @align(16) colour: vec3f,
}
