import { expect, test } from 'bun:test'
import { calculateCfmm, price } from './trade'

test('cfmm', () => {
  const amm = {
    shares: 10,
    usd: 110,
  }
  // put in $110 more
  const proposal = {
    shares: 0,
    usd: 110,
  }
  const newShares = calculateCfmm(amm, proposal)
  expect(newShares.usd).toBe(220)
  expect(newShares.shares).toBe(5)
  expect(price(newShares)).toBe(44)
})

test('cfmm2', () => {
  const amm = {
    shares: 10,
    usd: 110,
  }
  // sell 10 shares
  const proposal = {
    shares: 10,
    usd: 0,
  }
  const newShares = calculateCfmm(amm, proposal)
  expect(newShares.usd).toBe(55)
  expect(newShares.shares).toBe(20)
  expect(price(newShares)).toBe(2.75)
})
