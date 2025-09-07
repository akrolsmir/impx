'use client'
import { use } from 'react'
import { db } from '@/app/db'
import { ProjectRow } from '@/app/page'
import Stats from './stats'
import { buildAmm, price } from '@/app/math/trade'

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

  const profile = data2?.profiles[0]!
  const { receivedTxns, sentTxns } = profile
  const amm = buildAmm(receivedTxns, sentTxns, ticker)

  const ammStats = [
    { name: 'AMM USD', value: '$' + amm.usd },
    { name: 'AMM Shares', value: '' + amm.shares },
    { name: 'Price', value: '$' + price(amm) },
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
    </div>
  )
}
