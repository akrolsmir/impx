'use client'
import { use, useState } from 'react'
import { db } from '@/app/db'
import { ProjectRow } from '@/app/page'
import Stats from './stats'
import { AMM, buildAmm, calculateCfmm, price } from '@/app/math/trade'
import { executeTrade } from '@/app/math/tradeDb'

export default function Page(props: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(props.params)

  const { isLoading, data } = db.useQuery({
    projects: {
      $: {
        where: {
          ticker: ticker,
        },
      },
    },
  })

  const { isLoading: isLoading2, data: data2 } = db.useQuery({
    profiles: {
      $: { where: { name: `${ticker}-AMM` } },
      sentTxns: {},
      receivedTxns: {},
    },
  })

  if (isLoading || isLoading2) {
    return <p>Loading</p>
  }

  const project = data?.projects[0]
  const stats = [
    { name: 'Number of deploys', value: '405' },
    { name: 'Average deploy time', value: '3.65', unit: 'mins' },
    // { name: 'Number of servers', value: '3' },
    // { name: 'Success rate', value: '98.5%' },
  ]

  // console.log('prozz', `${ticker}-AMM`, JSON.stringify(data2))

  const profile = data2?.profiles[0]

  if (!profile) {
    return <>AMM profile not found :(</>
  }

  const { receivedTxns, sentTxns, id: ammId } = profile
  const amm = buildAmm(receivedTxns, sentTxns, ticker)

  const ammStats = [
    { name: 'AMM USD', value: '$' + amm.usd.toFixed(2) },
    { name: 'AMM Shares', value: '' + amm.shares.toFixed(2) },
    { name: 'Price', value: '$' + price(amm).toFixed(2) },
  ]

  if (!project) return <>no project :(</>

  return (
    <div className="font-mono min-h-screen flex justify-center items-center flex-col space-y-4">
      <table className="w-120">
        <tbody>
          <ProjectRow project={project} />
        </tbody>
      </table>
      <Stats stats={ammStats} />

      <db.SignedIn>
        <BuyWidget amm={amm} ammId={ammId} ticker={ticker} />
      </db.SignedIn>
    </div>
  )
}

function BuyWidget(props: { amm: AMM; ammId: string; ticker: string }) {
  const { amm, ammId, ticker } = props
  const user = db.useUser()
  const [amount, setAmount] = useState(1000)

  const newAmm = calculateCfmm(amm, { shares: 0, usd: -amount })
  const sharesToSell = newAmm.shares - amm.shares
  console.log('sharesToSell', sharesToSell)

  return (
    <>
      {/* Buy widget */}
      <div className="flex flex-col space-y-2">
        <input
          className="border border-gray-300 rounded-md p-2 cursor-pointer"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <button
          className="outline outline-green-200 bg-green-50 rounded-md p-2 cursor-pointer"
          onClick={() => {
            executeTrade(
              amm,
              { shares: 0, usd: amount },
              ammId,
              user.id,
              ticker
            )
          }}
        >
          Buy ${amount} of {ticker}
        </button>
        <button
          className="outline outline-red-200 bg-red-50 rounded-md p-2 cursor-pointer"
          onClick={() => {
            executeTrade(
              amm,
              { shares: sharesToSell, usd: 0 },
              ammId,
              user.id,
              ticker
            )
          }}
        >
          Sell ${amount} of {ticker}
        </button>
      </div>
    </>
  )
}
