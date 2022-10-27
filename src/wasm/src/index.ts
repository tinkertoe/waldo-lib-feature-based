export function matchFeatures(
  imageFeaturesTexture: Float32Array,
  templateFeaturesTexture: Float32Array,

  imageWidth: i32,
  imageHeight: i32,
  templateWidth: i32,
  templateHeight: i32,
  
  matchThreshold: u32,
  maximaSmoothingRadius: u32,
  requiredMarginToMostCommonAngle: f32
): u32[] {  
  // Eliminate non-feature pixels from arrays
  const imageFeatures: u32[] = filterFeatures(imageFeaturesTexture)
  const templateFeatures: u32[] = filterFeatures(templateFeaturesTexture)

  const registerA: Uint32Array = new Uint32Array(3601)
  const registerB: Uint32Array = new Uint32Array(3601)
  const registerC: Uint32Array = new Uint32Array(3601)
  const registerD: Uint32Array = new Uint32Array(3601)

  const matches: u32[] = []
  // Collect matches for each template feature and register every match angle
  for (let t: i32 = 0; t < templateFeatures.length; t = t+3) {
    for (let i: i32 = 0; i < imageFeatures.length; i = i+3) {
      // Evaluate if features are close enough
      if (binaryDistance(templateFeatures[t+0], imageFeatures[i+0]) <= matchThreshold) {
        const tx: u32 = templateFeatures[t+1]
        const ty: u32 = templateFeatures[t+2]
        const ix: u32 = imageFeatures[i+1]
        const iy: u32 = imageFeatures[i+2]

        // Calculate, register angles
        const angleA = calculateAngle(tx, ty, ix, iy, -templateWidth, imageHeight)
        const angleB = calculateAngle(tx, ty, ix, iy, imageWidth, imageHeight)
        const angleC = calculateAngle(tx, ty, ix, iy, imageWidth, -templateHeight)
        const angleD = calculateAngle(tx, ty, ix, iy, -templateWidth, -templateHeight)

        addOccurrence(angleA, registerA)
        addOccurrence(angleB, registerB)
        addOccurrence(angleC, registerC)
        addOccurrence(angleD, registerD)

        matches.push(tx)
        matches.push(ty)
        matches.push(ix)
        matches.push(iy)
        matches.push(angleA)
        matches.push(angleB)
        matches.push(angleC)
        matches.push(angleD)
      }
    }
  }

  const highestAngleOccurrenceA: u32 = findHighestAngleOccurrence(registerA)
  const highestAngleOccurrenceB: u32 = findHighestAngleOccurrence(registerB)
  const highestAngleOccurrenceC: u32 = findHighestAngleOccurrence(registerC)
  const highestAngleOccurrenceD: u32 = findHighestAngleOccurrence(registerD)

  // Filter matches
  const filteredMatches: u32[] = []
  for (let i = 0; i < matches.length; i = i+8) {
    let testsPassed: u8 = 0
    // testsPassed += checkMaxima(matches[i+4], registerA, maximaSmoothingRadius) ? 1 : 0
    // testsPassed += checkMaxima(matches[i+5], registerB, maximaSmoothingRadius) ? 1 : 0
    // testsPassed += checkMaxima(matches[i+6], registerC, maximaSmoothingRadius) ? 1 : 0
    // testsPassed += checkMaxima(matches[i+7], registerD, maximaSmoothingRadius) ? 1 : 0
    testsPassed += (marginToHighestAngleOccurrence(registerA[matches[i+4]], highestAngleOccurrenceA) <= requiredMarginToMostCommonAngle) ? 1 : 0
    testsPassed += (marginToHighestAngleOccurrence(registerB[matches[i+5]], highestAngleOccurrenceB) <= requiredMarginToMostCommonAngle) ? 1 : 0
    testsPassed += (marginToHighestAngleOccurrence(registerC[matches[i+6]], highestAngleOccurrenceC) <= requiredMarginToMostCommonAngle) ? 1 : 0
    testsPassed += (marginToHighestAngleOccurrence(registerD[matches[i+7]], highestAngleOccurrenceD) <= requiredMarginToMostCommonAngle) ? 1 : 0

    if (testsPassed >= 4) {
      filteredMatches.push(testsPassed)
    } else {
      // filteredMatches.push(testsPassed)
    }

    
  }

  // filteredMatches.push(highestAngleOccurrenceA)
  // filteredMatches.push(highestAngleOccurrenceB)
  // filteredMatches.push(highestAngleOccurrenceC)
  // filteredMatches.push(highestAngleOccurrenceD)


  return filteredMatches
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