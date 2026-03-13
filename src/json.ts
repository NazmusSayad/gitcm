import fs from 'fs'
import path from 'path'
import { configSchema } from './schema'

const schema = configSchema.toJSONSchema()
const outputPath = path.resolve('./schema.json')

if (fs.existsSync(outputPath)) {
  fs.rmSync(outputPath)
}

fs.writeFileSync(outputPath, JSON.stringify(schema))
