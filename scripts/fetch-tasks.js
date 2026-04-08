#!/usr/bin/env node

// Fetches task data from the OSRS wiki and outputs a static JSON file.
// Usage: node scripts/fetch-tasks.js > web/public/data/tasks.json

const WIKI_API =
  'https://oldschool.runescape.wiki/api.php?action=parse&page=Raging_Echoes_League/Tasks&prop=wikitext&format=json'

const TIER_POINTS = {
  easy: 10,
  medium: 40,
  hard: 80,
  elite: 200,
  master: 400,
}

async function fetchWikitext() {
  const res = await fetch(WIKI_API)
  const json = await res.json()
  return json.parse.wikitext['*']
}

function parseSkills(skillStr) {
  if (!skillStr || !skillStr.trim()) return []
  // Format: {{SCP|SkillName|level|link=yes}}
  const matches = [...skillStr.matchAll(/\{\{SCP\|([^|]+)\|(\d+)/g)]
  return matches.map(m => ({ skill: m[1], level: parseInt(m[2], 10) }))
}

function extractTemplateArgs(templateStr) {
  // Parse a {{Template|...}} string, respecting nested [[...]] and {{...}}
  const args = []
  let depth = 0
  let current = ''
  for (let i = 0; i < templateStr.length; i++) {
    const ch = templateStr[i]
    const next = templateStr[i + 1]
    if ((ch === '[' && next === '[') || (ch === '{' && next === '{')) {
      depth++
      current += ch + next
      i++
    } else if ((ch === ']' && next === ']') || (ch === '}' && next === '}')) {
      depth--
      current += ch + next
      i++
    } else if (ch === '|' && depth === 0) {
      args.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  args.push(current)
  return args
}

function stripWikiLinks(str) {
  // [[Page|Display]] -> Display, [[Page]] -> Page
  return str.replace(/\[\[([^\]]*?\|)?([^\]]*?)\]\]/g, '$2')
}

function parseTasks(wikitext) {
  const tasks = []
  // Find each {{RELTaskRow...}} handling nested brackets
  const pattern = /\{\{RELTaskRow\|/g
  let match
  while ((match = pattern.exec(wikitext)) !== null) {
    const start = match.index + 2 // skip opening {{
    let depth = 1
    let end = start
    for (let i = match.index + 2; i < wikitext.length - 1; i++) {
      if (wikitext[i] === '{' && wikitext[i + 1] === '{') {
        depth++
        i++
      } else if (wikitext[i] === '}' && wikitext[i + 1] === '}') {
        depth--
        if (depth === 0) {
          end = i
          break
        }
        i++
      }
    }
    const inner = wikitext.substring(start, end)
    const args = extractTemplateArgs(inner)
    // args[0] = "RELTaskRow", rest are positional/named
    const positional = []
    const named = {}
    for (let i = 1; i < args.length; i++) {
      const eqIdx = args[i].indexOf('=')
      if (eqIdx !== -1 && /^[a-z_]+$/.test(args[i].substring(0, eqIdx).trim())) {
        const key = args[i].substring(0, eqIdx).trim()
        named[key] = args[i].substring(eqIdx + 1).trim()
      } else {
        positional.push(args[i].trim())
      }
    }
    const tier = (named.tier || '').toLowerCase()
    tasks.push({
      id: parseInt(named.id, 10),
      name: stripWikiLinks(positional[0] || ''),
      description: stripWikiLinks(positional[1] || ''),
      skills: parseSkills(named.s || ''),
      other: stripWikiLinks(named.other || ''),
      tier,
      points: TIER_POINTS[tier] || 0,
      region: named.region || '',
    })
  }

  return tasks
}

async function main() {
  const wikitext = await fetchWikitext()
  const tasks = parseTasks(wikitext)

  if (tasks.length === 0) {
    console.error('No tasks parsed! Check the wiki page format.')
    process.exit(1)
  }

  console.error(`Parsed ${tasks.length} tasks`)

  const regions = [...new Set(tasks.map(t => t.region))].sort()
  const tiers = [...new Set(tasks.map(t => t.tier))]
  console.error(`Regions: ${regions.join(', ')}`)
  console.error(`Tiers: ${tiers.join(', ')}`)

  const output = {
    league: 'Raging Echoes',
    fetchedAt: new Date().toISOString(),
    tierPoints: TIER_POINTS,
    tasks,
  }

  console.log(JSON.stringify(output, null, 2))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
