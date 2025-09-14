import { id, i, init, InstaQLEntity } from '@instantdb/react'

// Optional: Declare your schema!
const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    profiles: i.entity({
      name: i.string().indexed(),
      thumbnail: i.string(),
    }),
    projects: i.entity({
      title: i.string(),
      ticker: i.string().unique().indexed(),
      thumbnail: i.string(),
      stats: i.json().optional(),
      price: i.number().optional(),
    }),
    txns: i.entity({
      amount: i.number(),
      token: i.string(), // 'USD', or ticker?
      // Todo: add timestamp
      createdAt: i.date().indexed(),
    }),
  },
  links: {
    userProfiles: {
      forward: { on: 'profiles', has: 'one', label: 'user' },
      reverse: { on: '$users', has: 'one', label: 'profile' },
    },
    txnSender: {
      forward: { on: 'txns', has: 'one', label: 'from' },
      reverse: { on: 'profiles', has: 'many', label: 'sentTxns' },
    },
    txnReceiver: {
      forward: { on: 'txns', has: 'one', label: 'to' },
      reverse: { on: 'profiles', has: 'many', label: 'receivedTxns' },
    },
    txnProject: {
      forward: { on: 'txns', has: 'one', label: 'project' },
      reverse: { on: 'projects', has: 'many', label: 'txns' },
    },
  },
})

// This helps Typescript display better intellisense
type _AppSchema = typeof _schema
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema

export type { AppSchema }
export default schema
