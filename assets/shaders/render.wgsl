struct Vertex {
  @location(0) position: vec3f,
  @location(1) normal: vec3f,
  @location(2) offset: vec3f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) normal: vec3f,
}

@group(0) @binding(0) var <uniform> perspectiveViewMatrix: mat4x4f;

const LIGHT_DIRECTION: vec3f = normalize(vec3f(1.0, 1.0, -1.0));
const DIFFUSE_COLOUR: vec3f = vec3f(1.0);
const AMBIENT_STRENGTH: f32 = 0.1;
const AMBIENT_COLOUR: vec3f = vec3f(1.0);

@vertex
fn vertexMain(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;

  output.position = perspectiveViewMatrix * vec4f(vertex.position + vertex.offset, 1.0);
  output.normal = vertex.normal;

  return output;
}

@fragment
fn fragmentMain(vertex: VertexOutput) -> @location(0) vec4f {
  let diffuseStrength: f32 = max(0.0, dot(vertex.normal, LIGHT_DIRECTION));
  let diffuse: vec3f = diffuseStrength * DIFFUSE_COLOUR;
  let ambient: vec3f = AMBIENT_STRENGTH * AMBIENT_COLOUR;

  return vec4f(diffuse + ambient, 1.0);
}
