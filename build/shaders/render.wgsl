#!import objects

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

struct Parameters {
  objectOffset: u32,
}

@group(0) @binding(0) var <uniform> perspectiveViewMatrix: mat4x4f;
@group(0) @binding(1) var <storage> objects: array<Object>;
@group(0) @binding(2) var <uniform> parameters: Parameters;

const LIGHT_DIRECTION: vec3f = normalize(vec3f(1.0, 1.0, 1.0));
const AMBIENT_STRENGTH: f32 = 0.1;
const AMBIENT_COLOUR: vec3f = vec3f(1.0);

@vertex
fn vertexMain(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;

  let object = objects[vertex.index + parameters.objectOffset];

  output.position = perspectiveViewMatrix * object.modelMatrix * vec4f(vertex.position, 1.0);
  output.normal = vertex.normal;
  output.colour = object.colour;

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
