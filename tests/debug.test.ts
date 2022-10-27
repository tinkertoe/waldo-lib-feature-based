import { Waldo } from '../src/index'
import WebGL from 'gl'
import { readImageData } from './assets/imageDataUtils'
import path from 'path'



test('beens', async () => {
  const waldo = new Waldo(WebGL(1, 1))
  const imageData = readImageData(path.join(__dirname, './assets/text2.png'))
  const templateData = readImageData(path.join(__dirname, './assets/text2_template.png'))

  await waldo.highestSimilarity(imageData, templateData)
})