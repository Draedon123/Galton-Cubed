import type { Matrix4 } from "./Matrix4";
import type { Vector3 } from "./Vector3";

class BufferWriter {
  public readonly buffer: ArrayBuffer;
  private readonly dataview: DataView;
  public readonly littleEndian: boolean;
  private offset: number;
  constructor(
    byteLength: number,
    littleEndian: boolean = true,
    offset: number = 0
  ) {
    this.buffer = new ArrayBuffer(byteLength);
    this.dataview = new DataView(this.buffer);
    this.littleEndian = littleEndian;
    this.offset = offset;
  }

  public writeUint8(uint8: number): void {
    this.dataview.setUint8(this.offset, uint8);
    this.offset += 1;
  }

  public writeUint32(uint32: number): void {
    this.dataview.setUint32(this.offset, uint32, this.littleEndian);
    this.offset += 4;
  }

  public writeFloat32(float32: number): void {
    this.dataview.setFloat32(this.offset, float32, this.littleEndian);
    this.offset += 4;
  }

  public writeVec3f(vec3f: Vector3): void {
    this.writeFloat32(vec3f.x);
    this.writeFloat32(vec3f.y);
    this.writeFloat32(vec3f.z);
  }

  public writeMat4x4f(mat4x4f: Matrix4): void {
    new Float32Array(this.buffer, this.offset, 16).set(mat4x4f.components);
    this.offset += 16 * 4;
  }

  public pad(bytes: number): void {
    this.offset += bytes;
  }
}

export { BufferWriter };
