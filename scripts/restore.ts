#!/usr/bin/env bun
import { init as initAdmin } from '@instantdb/admin'
import { readFile } from 'fs/promises'
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

  const backupFile = process.argv[2]
  if (!backupFile) {
    console.error('Error: Please provide a backup file path')
    console.error('Usage: bun scripts/restore.ts <backup-file.json>')
    process.exit(1)
  }

  const db = initAdmin({
    appId: APP_ID,
    adminToken,
  })

  console.log('Starting database restore...')

  try {
    // Read backup file
    console.log(`📂 Reading backup file: ${backupFile}`)
    const backupPath = path.isAbsolute(backupFile)
      ? backupFile
      : path.join(process.cwd(), backupFile)

    const backupData = await readFile(backupPath, 'utf-8')
    const backup = JSON.parse(backupData)

    // Validate backup structure
    if (!backup.entities || !backup.appId) {
      throw new Error('Invalid backup file format')
    }

    if (backup.appId !== APP_ID) {
      console.warn(
        `⚠️  Warning: Backup was created for app ${backup.appId}, but restoring to ${APP_ID}`
      )
      console.warn('   Continue? (y/N)')

      const response = prompt()
      if (response?.toLowerCase() !== 'y') {
        console.log('Restore cancelled')
        process.exit(0)
      }
    }

    console.log(`📅 Backup timestamp: ${backup.timestamp}`)
    console.log(`📊 Backup contains:`)
    for (const [entityName, entityData] of Object.entries(
      backup.entities || {}
    )) {
      const count = Array.isArray(entityData) ? entityData.length : 0
      console.log(`   - ${count} ${entityName}`)
    }

    console.log('\n⚠️  WARNING: This will overwrite existing data!')
    console.log('Are you sure you want to continue? (y/N)')

    const confirmation = prompt()
    if (confirmation?.toLowerCase() !== 'y') {
      console.log('Restore cancelled')
      process.exit(0)
    }

    // Start restore process
    console.log('\n🔄 Starting restore...')

    // Get entity names from schema and restore in order
    // Start with $users if it exists, then other entities
    const schemaEntityNames = Object.keys(schema.entities)
    const entityNames = []

    // Put $users first if it exists
    if (schemaEntityNames.includes('$users')) {
      entityNames.push('$users')
    }

    // Add all other entities
    for (const entityName of schemaEntityNames) {
      if (entityName !== '$users') {
        entityNames.push(entityName)
      }
    }

    for (const entityName of entityNames) {
      const entityData = backup.entities[entityName]
      if (!entityData || entityData.length === 0) {
        console.log(`⏭️  Skipping ${entityName} (no data)`)
        continue
      }

      console.log(`📝 Restoring ${entityData.length} ${entityName}...`)

      // Create transactions for each entity
      const txs = entityData.map((item: any) => {
        const { id, ...attrs } = item
        return db.tx[entityName][id].update(attrs)
      })

      // Batch restore in chunks to avoid overwhelming the API
      const chunkSize = 50
      for (let i = 0; i < txs.length; i += chunkSize) {
        const chunk = txs.slice(i, i + chunkSize)
        try {
          await db.transact(chunk)
          console.log(
            `   ✅ Restored ${Math.min(i + chunkSize, txs.length)}/${
              txs.length
            } ${entityName}`
          )
        } catch (error) {
          console.warn(
            `   ⚠️  Warning: Some ${entityName} may not have been restored:`,
            error
          )
        }
      }
    }

    // Restore relationships if available
    if (backup.relationships) {
      console.log('\n🔗 Restoring relationships...')

      // Process each relationship type from the schema
      for (const [linkName, linkDef] of Object.entries(schema.links)) {
        const relationshipData = backup.relationships[linkName]
        if (!relationshipData || relationshipData.length === 0) {
          console.log(`   ⏭️  Skipping ${linkName} (no data)`)
          continue
        }

        console.log(`   🔗 Restoring ${linkName} relationships...`)

        const forwardLabel = linkDef.forward.label
        const reverseLabel = linkDef.reverse.label

        for (const entity of relationshipData) {
          const relatedEntities = entity[reverseLabel]
          if (!relatedEntities) continue

          // Handle both single and multiple relationships
          const entitiesToLink = Array.isArray(relatedEntities)
            ? relatedEntities
            : [relatedEntities]

          for (const relatedEntity of entitiesToLink) {
            if (!relatedEntity || !relatedEntity.id) continue

            try {
              await db.transact([
                db.tx[String(linkDef.forward.on)][relatedEntity.id].link({
                  [forwardLabel]: entity.id,
                }),
              ])
            } catch (error) {
              console.warn(
                `   ⚠️  Could not restore ${linkName} link between ${entity.id} and ${relatedEntity.id}`
              )
            }
          }
        }
      }
    }

    console.log('\n✅ Restore completed successfully!')
    console.log('🎉 Your database has been restored from the backup')
  } catch (error) {
    console.error('❌ Restore failed:', error)
    process.exit(1)
  }
}

main()
