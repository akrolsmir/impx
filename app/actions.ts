import { id } from '@instantdb/admin'
import { adminDb } from './adminDb'
import { Txn } from './db'

export async function createTxn(props: {
  amount: number
  token: string
  from: string
  to: string
}) {
  const { amount, token, from, to } = props
  adminDb.transact(
    adminDb.tx.txns[id()]
      .create({
        amount,
        token,
      })
      .link({ from })
      .link({ to })
  )
}
