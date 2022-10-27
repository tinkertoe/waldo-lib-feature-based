#extension GL_OES_standard_derivatives : enable
precision highp float;

uniform sampler2D u_image;
uniform vec2 u_imageDimensions;
uniform float u_patchSize;
uniform float u_fingerprintPairs[FINGERPRINT_PAIRS];

void main() {
  vec4 pixel = texture2D(u_image, gl_FragCoord.xy/u_imageDimensions);
  float pixelAvg = step(0.5, (pixel.r + pixel.g + pixel.b + pixel.a) / 4.0);
  float slope = fwidth(pixelAvg) / 2.0;
  
  // Detect corner
  if(slope >= 1.0) {
    float fingerprint = 0.0;
    // Generate fingerprint
    for(int i = 0; i < FINGERPRINT_PAIRS/4; i++) {
      float ax = u_fingerprintPairs[i*4]   - 0.5;
      float ay = u_fingerprintPairs[i*4+1] - 0.5;
      float bx = u_fingerprintPairs[i*4+2] - 0.5;
      float by = u_fingerprintPairs[i*4+3] - 0.5;

      vec4 aPixel = texture2D(u_image, (gl_FragCoord.xy + vec2(ax, ay) * vec2(u_patchSize))/u_imageDimensions);
      vec4 bPixel = texture2D(u_image, (gl_FragCoord.xy + vec2(bx, by) * vec2(u_patchSize))/u_imageDimensions);

      float aAcc = aPixel.r + aPixel.g + aPixel.b + aPixel.a;
      float bAcc = bPixel.r + bPixel.g + bPixel.b + bPixel.a;

      if(aAcc > bAcc) {
        fingerprint = fingerprint + pow(2.0, float(FINGERPRINT_PAIRS/4-i));
      }
    }

    gl_FragColor = vec4(1, fingerprint, gl_FragCoord.x, gl_FragCoord.y);
  } else {
    gl_FragColor = vec4(0);
  }
}