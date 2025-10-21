struct Vertex {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @builtin(instance_index) index: u32,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
}

struct Balls {
  @align(16) count: u32,
  balls: array<Ball>,
}

struct Ball {
  @align(16) @size(64) modelMatrix: mat4x4f,
  @align(16) @size(48) normalMatrix: mat3x3f,
}

@group(0) @binding(0) var <uniform> perspectiveViewMatrix: mat4x4f;
@group(0) @binding(1) var <storage> balls: Balls;

const LIGHT_DIRECTION: vec3f = normalize(vec3f(1.0, 1.0, 1.0));
const DIFFUSE_COLOUR: vec3f = vec3f(1.0);
const AMBIENT_STRENGTH: f32 = 0.1;
const AMBIENT_COLOUR: vec3f = vec3f(1.0);

@vertex
fn vertexMain(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;

  output.position = perspectiveViewMatrix * balls.balls[vertex.index].modelMatrix * vec4f(vertex.position, 1.0);
  output.normal = normalize(balls.balls[vertex.index].normalMatrix * vertex.normal);

  return output;
}

@fragment
fn fragmentMain(vertex: VertexOutput) -> @location(0) vec4f {
  let diffuseStrength: f32 = max(0.0, dot(vertex.normal, LIGHT_DIRECTION));
  let diffuse: vec3f = diffuseStrength * DIFFUSE_COLOUR;
  let ambient: vec3f = AMBIENT_STRENGTH * AMBIENT_COLOUR;

  return vec4f(diffuse + ambient, 1.0);
}
