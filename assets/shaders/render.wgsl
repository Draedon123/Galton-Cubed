#!import shared

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
@group(0) @binding(3) var <uniform> physicsSettings: PhysicsSettings;
@group(0) @binding(4) var <storage> heights: array<f32>;
@group(0) @binding(5) var <storage> ballsToDraw: array<u32>;
@group(0) @binding(6) var skybox: texture_cube<f32>;
@group(0) @binding(7) var textureSampler: sampler;

const LIGHT_DIRECTION_1: vec3f = normalize(vec3f(-0.25, 1.0, 0.35));
const LIGHT_DIRECTION_2: vec3f = normalize(vec3f(0.5, -0.2, -0.75));
const AMBIENT_STRENGTH: f32 = 0.1;
const AMBIENT_COLOUR: vec3f = vec3f(1.0);

@vertex
fn vertexMain(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;

  var object = objects[vertex.index + parameters.objectOffset];
  var modelMatrix: mat4x4f = object.modelMatrix;

  if(parameters.objectOffset > 0){
    // is a cube (part of the floor)

    let position: vec3f = extractPosition(object.modelMatrix);
    let bufferIndex: u32 = getBufferIndex(position.xz, physicsSettings.floorSideLength);
    let height: f32 = heights[bufferIndex];

    object.colour.r -= 1.0 - pow(1.0 - (0.010 * height), 4);
    object.colour.g -= 1.0 - pow(1.0 - (0.020 * height), 4);
    object.colour.b -= 1.0 - pow(1.0 - (0.005 * height), 4);

    // scale Y
    modelMatrix[1].x *= height;
    modelMatrix[1].y *= height;
    modelMatrix[1].z *= height;

    // translate Y
    modelMatrix[3][1] += (modelMatrix[1].y - 1.0) / 2.0;
  } else if(vertex.index >= physicsSettings.pegCount){
    // is a ball
    
    object = objects[ballsToDraw[vertex.index - physicsSettings.pegCount]];
    modelMatrix = object.modelMatrix;
  }

  output.position = perspectiveViewMatrix * modelMatrix * vec4f(vertex.position, 1.0);
  output.normal = vertex.normal;
  output.colour = object.colour;

  return output;
}

@fragment
fn fragmentMain(vertex: VertexOutput) -> @location(0) vec4f {
  let diffuseStrength_1: f32 = max(dot(vertex.normal, LIGHT_DIRECTION_1), 0.0);
  let diffuseStrength_2: f32 = max(dot(vertex.normal, LIGHT_DIRECTION_2), 0.0);
  let diffuse: vec3f = min(0.75 * (diffuseStrength_1 + diffuseStrength_2), 1.0) * vertex.colour;
  let ambient: vec3f = AMBIENT_STRENGTH * AMBIENT_COLOUR;
  let skyboxColour: vec3f = textureSample(skybox, textureSampler, vertex.normal).xyz;

  return vec4f(diffuse + ambient + 0.5 * skyboxColour, 1.0);
  // return vec4f((vertex.normal + 1.0) / 2.0, 1.0);
}
