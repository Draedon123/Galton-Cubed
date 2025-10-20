struct Vertex {
  @location(0) position: vec3f,
  @location(1) offset: vec3f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
}

@group(0) @binding(0) var <uniform> perspectiveViewMatrix: mat4x4f;

@vertex
fn vertexMain(vertex: Vertex) -> VertexOutput {
  var output: VertexOutput;

  output.position = perspectiveViewMatrix * vec4f(vertex.position + vertex.offset, 1.0);

  return output;
}

@fragment
fn fragmentMain(vertex: VertexOutput) -> @location(0) vec4f {
  return vec4f(1.0);
}
