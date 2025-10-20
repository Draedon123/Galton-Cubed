const TO_RADIANS = Math.PI / 180;

function radians(degrees: number): number {
  return degrees * TO_RADIANS;
}

const TO_DEGREES = 180 / Math.PI;

function degrees(radians: number): number {
  return radians * TO_DEGREES;
}

export { radians, degrees };
