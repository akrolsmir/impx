import schema from '@/instant.schema'
import { init } from '@instantdb/admin'

// ID for app: impx
const APP_ID = '9b5ee315-b42e-48af-a337-cb0be830674f'
export const adminDb = init({
  appId: APP_ID,
  adminToken: process.env.INSTANT_APP_ADMIN_TOKEN!,
  schema,
})
