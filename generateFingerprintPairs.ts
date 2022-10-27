const fingerprintPairs: Number[] = []
for (let i = 0; i < parseInt(process.argv[2])*4; i++) {
  fingerprintPairs[i] = parseFloat(Math.random().toFixed(3))
}
console.log(`const fingerprintPairs: Number[] = ${JSON.stringify(fingerprintPairs)}`)