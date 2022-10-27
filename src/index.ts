import { readFileSync } from 'fs'
import path from 'path'
import * as gpu from './gpu/index'
import { imageDataToTexture } from './gpu/utils'
import { WaldoImageData } from './types'
import { instantiate } from './wasm/build/index'

export class Waldo {
  private gl: WebGLRenderingContext
  private computeFeatures: gpu.ComputeFeatures
  private downloadTexture: gpu.DownloadTexture
  private wasm: ReturnType<typeof instantiate>

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl
    this.gl.getExtension('OES_texture_float')
    this.gl.getExtension('OES_standard_derivatives')

    this.computeFeatures = new gpu.ComputeFeatures(this.gl)
    this.downloadTexture = new gpu.DownloadTexture(this.gl)

    this.wasm = new Promise(resolve => {
      const wasmData = readFileSync(path.join(__dirname, './wasm/build/index.wasm'))
      WebAssembly.compile(wasmData).then(wasmModule => {
        instantiate(wasmModule, { env: {} }).then(v => {
          resolve(v)
        })
      })
    })
  }

  public async debug(imageData: WaldoImageData) {
    console.time('r')
    // console.log((await this.wasm).matchFeatures(imageData.data as Float32Array,))
    console.timeEnd('r')
  }

  public async highestSimilarity(imageData: WaldoImageData, templateData: WaldoImageData) {
    const image = imageDataToTexture(this.gl, imageData)
    const template = imageDataToTexture(this.gl, templateData)

    const imageFeatures = this.downloadTexture.run(this.computeFeatures.run(image))
    const templateFeatures = this.downloadTexture.run(this.computeFeatures.run(template))

    const wasm = await this.wasm
    const angles = wasm.matchFeatures(
      imageFeatures.data as Float32Array,
      templateFeatures.data as Float32Array,
      image.dimensions.w,
      image.dimensions.h,
      template.dimensions.w,
      template.dimensions.h,
      16,  // matchThreshhold
      10, // maximaSmootingRadius
      1.0 // requiredMarginToMostCommonAngle
    )

    console.log(angles)
  }

  public async destroy() {
    this.computeFeatures.destroy()
    this.downloadTexture.destroy()
    this.gl.getExtension('WEBGL_lose_context')?.loseContext()
    if (this.gl.canvas !== undefined) {
      this.gl.canvas.remove()
    }
  }
}