#!import balls

struct Vertex {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @builtin(instance_index) index: u32,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
  @location(1) colour: vec3f,
}

@group(0) @binding(0) var <uniform> perspectiveViewMatrix: mat4x4f;
@group(0) @binding(1) var <storage> balls: Balls;

const LIGHT_DIRECTION: vec3f = normalize(vec3f(1.0, 1.0, 1.0));
const AMBIENT_STRENGTH: f32 = 0.1;
const AMBIENT_COLOUR: vec3f = vec3f(1.0);

@vertex
fn vertexMain(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;

  let ball = balls.balls[vertex.index];
  output.position = perspectiveViewMatrix * ball.modelMatrix * vec4f(vertex.position, 1.0);
  output.normal = vertex.normal;
  output.colour = ball.colour;

  return output;
}

@fragment
fn fragmentMain(vertex: VertexOutput) -> @location(0) vec4f {
  let diffuseStrength: f32 = max(0.0, dot(vertex.normal, LIGHT_DIRECTION));
  let diffuse: vec3f = diffuseStrength * vertex.colour;
  let ambient: vec3f = AMBIENT_STRENGTH * AMBIENT_COLOUR;

  return vec4f(diffuse + ambient, 1.0);
  // return vec4f((vertex.normal + 1.0) / 2.0, 1.0);
}
