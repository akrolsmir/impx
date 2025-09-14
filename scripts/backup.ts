#!/usr/bin/env bun
import { init as initAdmin } from '@instantdb/admin'
import { writeFile } from 'fs/promises'
import path from 'path'
import schema from '../instant.schema'

const APP_ID = '9b5ee315-b42e-48af-a337-cb0be830674f'

async function main() {
  const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN
  if (!adminToken) {
    console.error(
      'Error: INSTANT_APP_ADMIN_TOKEN environment variable is required'
    )
    console.error('Get your admin token from the InstantDB dashboard')
    process.exit(1)
  }

  const db = initAdmin({
    appId: APP_ID,
    adminToken,
  })

  console.log('Starting database backup...')

  try {
    // Get entity names from schema
    const entityNames = Object.keys(schema.entities)
    console.log(
      `Found ${entityNames.length} entities in schema: ${entityNames.join(
        ', '
      )}`
    )

    // Fetch all data from each entity
    const entities: Record<string, any[]> = {}
    for (const entityName of entityNames) {
      console.log(`Fetching ${entityName}...`)
      const query = { [entityName]: {} }
      const result = await db.query(query)
      entities[entityName] = result[entityName] || []
    }

    // Build relationship queries from schema links
    console.log('Fetching relationships...')
    const relationships: Record<string, any[]> = {}

    // For each link in the schema, fetch the related data
    for (const [linkName, linkDef] of Object.entries(schema.links)) {
      const forwardEntity = linkDef.forward.on
      const forwardLabel = linkDef.forward.label
      const reverseEntity = linkDef.reverse.on
      const reverseLabel = linkDef.reverse.label

      console.log(
        `  Fetching ${linkName} (${String(
          forwardEntity
        )}.${forwardLabel} <-> ${String(reverseEntity)}.${reverseLabel})...`
      )

      // Query from the forward entity with the reverse relationship
      try {
        const query = {
          [forwardEntity]: {
            [reverseLabel]: {},
          },
        }
        const result = await db.query(query)
        relationships[linkName] = result[String(forwardEntity)] || []
      } catch (error) {
        console.warn(
          `    Warning: Could not fetch relationship ${linkName}:`,
          error
        )
        relationships[linkName] = []
      }
    }

    // Create backup object
    const backup = {
      timestamp: new Date().toISOString(),
      appId: APP_ID,
      entities,
      relationships,
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup-${timestamp}.json`
    const filepath = path.join(process.cwd(), 'backups', filename)

    // Ensure backups directory exists
    await Bun.write(path.join(process.cwd(), 'backups', '.gitkeep'), '')

    // Write backup file
    await writeFile(filepath, JSON.stringify(backup, null, 2))

    console.log(`✅ Backup completed successfully!`)
    console.log(`📁 Backup saved to: ${filepath}`)
    console.log(`📊 Backed up:`)
    for (const [entityName, entityData] of Object.entries(backup.entities)) {
      console.log(`   - ${entityData.length} ${entityName}`)
    }
  } catch (error) {
    console.error('❌ Backup failed:', error)
    process.exit(1)
  }
}

main()
