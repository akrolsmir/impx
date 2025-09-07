import { AMM, calculateCfmm, diffAmm } from './trade'
import { db } from '../db'
import { id } from '@instantdb/react'

export function executeTrade(
  amm: AMM,
  proposal: AMM,
  ammId: string,
  traderId: string,
  token: string
) {
  const newAmm = calculateCfmm(amm, proposal)
  const delta = diffAmm(newAmm, amm)

  const [payerId, sharerId] =
    delta.usd > 0 ? [traderId, ammId] : [ammId, traderId]

  db.transact([
    db.tx.txns[id()]
      .create({
        amount: delta.usd,
        token: 'USD',
      })
      .link({ from: payerId })
      .link({ to: sharerId }),
    db.tx.txns[id()]
      .create({
        amount: delta.shares,
        token: token,
      })
      .link({ from: sharerId })
      .link({ to: payerId }),
  ])
}
