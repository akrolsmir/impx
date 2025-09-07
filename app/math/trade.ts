import { Txn } from '../db'

type AMM = {
  shares: number
  usd: number
}

export function price(amm: AMM) {
  return amm.usd / amm.shares
}

// Calculate what a purchase would look like using constant function market maker
// proposal should be a new amm, with either shares or USD positive, the other 0
export function calculateCfmm(amm: AMM, proposal: AMM): AMM {
  if (
    !(proposal.shares > 0 && proposal.usd === 0) &&
    !(proposal.shares === 0 && proposal.usd > 0)
  ) {
    throw new Error('Invalid proposal:' + JSON.stringify(proposal))
  }

  const k = amm.shares * amm.usd
  if (proposal.shares > 0) {
    const newShares = amm.shares + proposal.shares
    const newUsd = k / newShares
    return {
      shares: newShares,
      usd: newUsd,
    }
  } else {
    const newUsd = amm.usd + proposal.usd
    const newShares = k / newUsd
    return {
      shares: newShares,
      usd: newUsd,
    }
  }
}

export function buildAmm(
  receivedTxns: Txn[],
  sentTxns: Txn[],
  token?: string
): AMM {
  let usd = 0
  let shares = 0
  for (const receivedTxn of receivedTxns) {
    if (receivedTxn.token === 'USD') {
      usd += receivedTxn.amount
    }
    if (receivedTxn.token === token) {
      shares += receivedTxn.amount
    }
  }

  for (const sentTxn of sentTxns) {
    if (sentTxn.token === 'USD') {
      usd -= sentTxn.amount
    }
    if (sentTxn.token === token) {
      shares -= sentTxn.amount
    }
  }

  return {
    usd,
    shares,
  }
}
