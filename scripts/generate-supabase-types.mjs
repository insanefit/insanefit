import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repoRoot = resolve(process.cwd())
const envPath = resolve(repoRoot, '.env')
const outputPath = resolve(repoRoot, 'src/types/database.generated.ts')

const readProjectId = () => {
  const explicit = process.env.SUPABASE_PROJECT_ID?.trim()
  if (explicit) return explicit

  const envContent = readFileSync(envPath, 'utf8')
  const urlMatch = envContent.match(/^VITE_SUPABASE_URL=(.+)$/m)
  const url = urlMatch?.[1]?.trim() ?? ''
  const idMatch = url.match(/^https:\/\/([^.]+)\.supabase\.co\/?$/)
  return idMatch?.[1] ?? ''
}

const projectId = readProjectId()
if (!projectId) {
  throw new Error('Nao foi possivel identificar SUPABASE_PROJECT_ID nem VITE_SUPABASE_URL.')
}

if (!process.env.SUPABASE_ACCESS_TOKEN?.trim()) {
  throw new Error('Defina SUPABASE_ACCESS_TOKEN para gerar tipos automaticamente.')
}

const command = `npx supabase gen types typescript --project-id ${projectId} --schema public --schema auth`
const generated = execSync(command, {
  cwd: repoRoot,
  stdio: ['ignore', 'pipe', 'inherit'],
  encoding: 'utf8',
})

const banner = `/**\n * Arquivo gerado automaticamente por scripts/generate-supabase-types.mjs\n * Nao edite manualmente.\n */\n\n`
writeFileSync(outputPath, banner + generated, 'utf8')

console.log(`Tipos gerados em: ${outputPath}`)
