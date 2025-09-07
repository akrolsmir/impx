import { init, InstaQLEntity } from '@instantdb/react'
import schema from '@/instant.schema'

export type Txn = InstaQLEntity<typeof schema, 'txns'>
export type Project = InstaQLEntity<typeof schema, 'projects'>

const APP_ID = '9b5ee315-b42e-48af-a337-cb0be830674f'
export const db = init({ appId: APP_ID, schema })
