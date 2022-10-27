import { Program } from './Program'
import { WaldoImageData, WaldoTexture } from '../types'
import fs from 'fs'
import path from 'path'

const fragShaderSource = fs.readFileSync(path.join(__dirname, './shaders/downloadTexture.fs'), 'utf8')

export class DownloadTexture extends Program {
  constructor(gl: WebGLRenderingContext) {
    super(gl, fragShaderSource)
  }

  public run(texture: WaldoTexture): WaldoImageData {
    this.outputDimensions(texture.dimensions, texture.type)

    this.render({
      u_texture: texture.texture,
      u_textureDimensions: [ texture.dimensions.w, texture.dimensions.h ]
    }, false) // Don't cleanup automaticly

    const arrayLength = this.outputTexture.dimensions.w*this.outputTexture.dimensions.h*4

    if (texture.type === 'float') {
      // Read from framebuffer
      const pixels = new Float32Array(arrayLength)
      this.gl.readPixels(0, 0, this.outputTexture.dimensions.w, this.outputTexture.dimensions.h, this.gl.RGBA, this.gl.FLOAT, pixels)

      // Cleanup
      this.gl.deleteTexture(texture.texture)
      this.gl.deleteTexture(this.outputTexture.texture)
      this.cleanup() // Cleanup after texture readout

      return {
        data: pixels,
        width: this.outputTexture.dimensions.w,
        height: this.outputTexture.dimensions.h
      }
    } else {
      // Read from framebuffer
      const pixels = new Uint8Array(arrayLength)
      this.gl.readPixels(0, 0, this.outputTexture.dimensions.w, this.outputTexture.dimensions.h, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels)

      // Cleanup
      this.gl.deleteTexture(texture.texture)
      this.gl.deleteTexture(this.outputTexture.texture)
      this.cleanup() // Cleanup after texture readout

      return {
        data: new Uint8ClampedArray(pixels),
        width: this.outputTexture.dimensions.w,
        height: this.outputTexture.dimensions.h
      }
    }
  }
}