function roundUp(x: number, toMultiple: number): number {
  return x + toMultiple - (x % toMultiple);
}

export { roundUp };
