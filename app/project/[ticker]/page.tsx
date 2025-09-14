'use client'
import { use, useState } from 'react'
import { db } from '@/app/db'
import { ProjectRow } from '@/app/page'
import Stats from './stats'
import { AMM, buildAmm, calculateCfmm, price } from '@/app/math/trade'
import { executeTrade } from '@/app/math/tradeDb'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'

export default function Page(props: { params: Promise<{ ticker: string }> }) {
  const { ticker } = use(props.params)

  const { isLoading, data } = db.useQuery({
    projects: {
      $: { where: { ticker } },
    },
    profiles: {
      $: { where: { name: `${ticker}-AMM` } },
      sentTxns: {
        from: { $: { fields: ['name'] } },
        to: { $: { fields: ['name'] } },
      },
      receivedTxns: {
        from: { $: { fields: ['name'] } },
        to: { $: { fields: ['name'] } },
      },
    },
  })

  if (isLoading) {
    return <p>Loading</p>
  }

  const project = data?.projects[0]
  const stats = [
    { name: 'Number of deploys', value: '405' },
    { name: 'Average deploy time', value: '3.65', unit: 'mins' },
    // { name: 'Number of servers', value: '3' },
    // { name: 'Success rate', value: '98.5%' },
  ]

  const profile = data?.profiles[0]

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

  const txns = [...receivedTxns, ...sentTxns].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  return (
    <div className="font-mono min-h-screen flex justify-center items-center flex-col space-y-12 p-8">
      {/* <ProjectRow project={project} /> */}
      <div className="flex flex-row space-x-4 items-center">
        <Link href="/" className="hover:cursor-pointer">
          <ArrowLeftIcon className="w-6 h-6" />
        </Link>
        <img
          src={project.thumbnail}
          alt={project.title}
          className="w-12 h-12"
        />
        <h1 className="text-2xl">{project.title}</h1>
        <h2 className="text-2xl">{project.ticker}</h2>
      </div>

      <div className="flex flex-row space-x-4 items-center">
        <Stats stats={ammStats} />

        <db.SignedIn>
          <BuyWidget amm={amm} ammId={ammId} ticker={ticker} />
        </db.SignedIn>
      </div>

      {/* Show all txns as a table */}
      <table className="">
        <thead>
          <tr>
            <th className="px-2 py-1 border-b">Amount</th>
            <th className="px-2 py-1 border-b">Token</th>
            <th className="px-2 py-1 border-b">From</th>
            <th className="px-2 py-1 border-b">To</th>
            <th className="px-2 py-1 border-b">Date</th>
          </tr>
        </thead>
        <tbody>
          {txns.map((txn) => (
            <tr key={txn.id}>
              <td className="px-2 py-1 border-b">{txn.amount}</td>
              <td className="px-2 py-1 border-b">{txn.token}</td>
              <td className="px-2 py-1 border-b">{txn.from?.name}</td>
              <td className="px-2 py-1 border-b">{txn.to?.name}</td>
              <td className="px-2 py-1 border-b">
                {new Date(txn.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BuyWidget(props: { amm: AMM; ammId: string; ticker: string }) {
  const { amm, ammId, ticker } = props
  const user = db.useUser()
  const [amount, setAmount] = useState(100)

  const newAmm = calculateCfmm(amm, { shares: 0, usd: -amount })
  const sharesToSell = newAmm.shares - amm.shares
  console.log('sharesToSell', sharesToSell)

  return (
    <div className="flex flex-col space-y-2 items-center p-4 border border-gray-300 rounded-md">
      <h2 className="text-lg font-bold">Trade {ticker}</h2>
      <input
        className="border border-gray-300 rounded-md p-2 cursor-pointer"
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />
      {/* Quick trade -- buttons to set amount to 10, 50, 100, 500 */}
      <div className="flex flex-row space-x-2 justify-between w-full">
        {[10, 50, 100, 500].map((amount) => (
          <button
            className="bg-gray-100 hover:bg-gray-200 rounded-md p-2 cursor-pointer"
            onClick={() => setAmount(amount)}
          >
            {amount}
          </button>
        ))}
      </div>

      <div className="flex flex-row space-x-2 mt-8">
        <button
          className="outline outline-green-200 bg-green-50 hover:bg-green-100 rounded-md p-2 cursor-pointer"
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
          Buy
        </button>
        <button
          className="outline outline-red-200 bg-red-50 hover:bg-red-100 rounded-md p-2 cursor-pointer"
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
          Sell
        </button>
      </div>
    </div>
  )
}
