import { id, i, init, InstaQLEntity } from '@instantdb/react'

// Optional: Declare your schema!
const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    projects: i.entity({
      title: i.string(),
      ticker: i.string().unique().indexed(),
      thumbnail: i.string(),
    }),
    txns: i.entity({
      amount: i.number(),
      token: i.string(), // 'USD', or ticker?
    }),
  },
  links: {
    txnSender: {
      forward: { on: 'txns', has: 'one', label: 'from' },
      reverse: { on: '$users', has: 'many', label: 'sentTxns' },
    },
    txnReceiver: {
      forward: { on: 'txns', has: 'one', label: 'to' },
      reverse: { on: '$users', has: 'many', label: 'receivedTxns' },
    },
    txnProject: {
      forward: { on: 'txns', has: 'one', label: 'projects' },
      reverse: { on: 'txns', has: 'many', label: 'txns' },
    },
  },
})

// This helps Typescript display better intellisense
type _AppSchema = typeof _schema
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema

export type { AppSchema }
export default schema
