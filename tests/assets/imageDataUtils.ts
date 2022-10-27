import { decode, encode } from 'fast-png'
import { readFileSync, writeFileSync } from 'fs'
import { WaldoImageData } from '../../src/types'

export function writeImageData(imageData: WaldoImageData, path: string): void {
  writeFileSync(path, encode({
    data: new Uint8ClampedArray(imageData.data),
    width: imageData.width,
    height: imageData.height
  }))
}

export function readImageData(path: string): WaldoImageData {
  if (!path.endsWith('.png')) { throw new Error(`path doesn't end with .png`) }

  const png = decode(readFileSync(path))

  return {
    data: new Uint8ClampedArray(png.data),
    width: png.width,
    height: png.height
  }
}

export function stringifyImageData(imageData: WaldoImageData): string {
  /*
    Convert image data to JSON for storage in ts file.

    For performance sake the data entry
    which would get translated to an object
    is replaced with an array of the values.

    { 0: 255, 1: 183, 2: 87 } => [255, 183, 87]
  */

  // JSON.stringify needs a non-typed version of the object to work
  const genericImageData = { data: imageData.data, width: imageData.width, height: imageData.height }

  const json = JSON.stringify(genericImageData, (key, value) => {
    // data gets turned into array
    if (key === 'data') {
      return Object.values(value)
    }
    // width and hight are left as is
    return value
  })

  return json
}

export function parseImageData(json: string): WaldoImageData {
  // Convert JSON string back into ImageData.
  return JSON.parse(json, (key, value) => {
    /*
      The data key needs to be converted
      from number[] to Uint8ClampedArray
      so it fits the type (ImageData).
    */
    if (key === 'data') {
      return new Uint8ClampedArray(value)
    }

    // The width and hight keys are left as is
    return value
  }) as WaldoImageData
}

export function loggableImageData(imageData: WaldoImageData, includeFullPixel: boolean = false): string {
  let buffer = ''
  for (let i = 0; i < imageData.data.length; i++) {
    if (i%(imageData.width*4)==0) {
      buffer += '\n'
    }
    if ((!includeFullPixel && i%4==0) || includeFullPixel) {
      buffer += imageData.data[i].toString() + ', '
    }
  }
  return buffer
}