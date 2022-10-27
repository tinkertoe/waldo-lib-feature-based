export function matchFeatures(
  imageFeaturesTexture: Float32Array,
  templateFeaturesTexture: Float32Array,
): u32[] {  
  // Eliminate non-feature pixels from arrays
  const imageFeatures: u32[] = filterFeatures(imageFeaturesTexture)
  const templateFeatures: u32[] = filterFeatures(templateFeaturesTexture)

  const matches: u32[] = []
  // Collect matches for each template feature and register every match angle
  for (let t: i32 = 0; t < templateFeatures.length; t = t+3) {
    for (let i: i32 = 0; i < imageFeatures.length; i = i+3) {
      // Find image feature with closest distance
      // Find image feature with 2nd clostest distance

      /*
        k-nearest-neighbour aproach
        k = 1 => given a template feature gimme the closest image feature
        k = 2 => given a template feature gimme the two closest image features

        in annoy terms:

          template feature  = querry
             image features = index
          
          image feature index is one-dimensional

          for binary features descriptors distance metric has to be **hamming**

          add all image features to AnnoyIndex:
            add_item(index_of_feature, feature_description)

          build AnnoyIndex:
            build(n_trees=10, n_jobs=1)

          AnnoyIndex is template independent so can be session cached
          
      */
    }
  }

  return matches
}

function filterFeatures(texture: Float32Array): u32[] {
  const output: u32[] = []
  for (let i: i32 = 0; i < texture.length; i = i+4) {
    if (texture[i+0] == f32(1)) {
      output.push(<u32>texture[i+1]) // fingerprint
      output.push(<u32>texture[i+2]) // x
      output.push(<u32>texture[i+3]) // y
    }
  }
  return output
}

function binaryDistance(a: u32, b: u32): u32 {
  let distance: u32 = 0

  const aString: string = a.toString(2)
  const bString: string = b.toString(2)

  const desiredLength: i32 = <i32>Mathf.max(<f32>aString.length, <f32>bString.length)

  aString.padStart(desiredLength, '0')
  bString.padStart(desiredLength, '0')

  for (let i: i32 = 0; i < desiredLength; i++) {
    if (aString.charCodeAt(i) != bString.charCodeAt(i)) {
      distance++
    }
  }

  return distance
}

function calculateAngle(tx: u32, ty: u32, ix: u32, iy: u32, dx: i32, dy: i32): u32 {
  const m: f32 = (<f32>ty + <f32>dy - <f32>iy) / (<f32>tx + <f32>dx - <f32>ix)
  const angle: u32 = <u32>(Mathf.round(Mathf.atan(m) * 180.0 / Mathf.PI * 10.0 + 1800))
  if (!(angle >= 0 && angle < 3600)) {
    throw new Error(`calculated angle ${angle.toString()} is out of range 0 - 3600`)
  }
  return angle
}

function addOccurrence(angle: u32, register: Uint32Array): void {
  if (!(angle >= 0 && angle < u32(register.length))) {
    throw new Error(`angle ${angle.toString()} is out of range 0 - ${(register.length-1).toString()}`)
  }
  register[angle] = register[angle] + 1
}

function findHighestAngleOccurrence(register: Uint32Array): u32 {
  let mostFrequentAngle: u32 = 0
  let mostFrequentAngleOccurences: u32 = 0

  for (let i: i32 = 0; i < register.length; i++) {
    if (register[i] >= mostFrequentAngleOccurences) {
      mostFrequentAngle = i
      mostFrequentAngleOccurences = register[i]
    }
  }

  return mostFrequentAngleOccurences
}

function checkMaxima(angle: u32, register: Uint32Array, smoothingRadius: u32): bool {
  let prev: f32 = 0
  let curr: f32 = 0
  let next: f32 = 0

  for (let r: i32 = 0; r < i32(smoothingRadius); r++) {
    prev += <f32>getOccurrences(<i32>angle - 1 + r, register)
    prev += <f32>getOccurrences(<i32>angle - 1 - r, register)
    curr += <f32>getOccurrences(<i32>angle     + r, register)
    curr += <f32>getOccurrences(<i32>angle     - r, register)
    next += <f32>getOccurrences(<i32>angle + 1 + r, register)
    next += <f32>getOccurrences(<i32>angle + 1 - r, register)
  }

  prev = prev / f32(smoothingRadius*2)
  curr = curr / f32(smoothingRadius*2)
  next = next / f32(smoothingRadius*2)

  return (prev < curr && next < curr)
}

function getOccurrences(angle: i32, register: Uint32Array): u32 {
  if (!(angle >= 0 && angle < register.length)) {
    return 0 // return zero if angle does not exist
  } else {
    return register[<u32>angle]
  }
}

function marginToHighestAngleOccurrence(angleOccurrence: u32, highestAngleOccurrence: u32): f32 {
  return 1.0 - f32(angleOccurrence) / f32(highestAngleOccurrence)
}