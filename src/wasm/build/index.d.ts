declare namespace __AdaptedExports {
  /** Exported memory */
  export const memory: WebAssembly.Memory;
  /**
   * src/wasm/src/index/matchFeatures
   * @param imageFeaturesTexture `~lib/typedarray/Float32Array`
   * @param templateFeaturesTexture `~lib/typedarray/Float32Array`
   * @param imageWidth `i32`
   * @param imageHeight `i32`
   * @param templateWidth `i32`
   * @param templateHeight `i32`
   * @param matchThreshold `u32`
   * @param maximaSmoothingRadius `u32`
   * @param requiredMarginToMostCommonAngle `f32`
   * @returns `~lib/array/Array<u32>`
   */
  export function matchFeatures(imageFeaturesTexture: Float32Array, templateFeaturesTexture: Float32Array, imageWidth: number, imageHeight: number, templateWidth: number, templateHeight: number, matchThreshold: number, maximaSmoothingRadius: number, requiredMarginToMostCommonAngle: number): Array<number>;
}
/** Instantiates the compiled WebAssembly module with the given imports. */
export declare function instantiate(module: WebAssembly.Module, imports: {
  env: unknown,
}): Promise<typeof __AdaptedExports>;
