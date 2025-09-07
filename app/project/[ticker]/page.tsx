'use client'
import { use } from 'react'
import { db } from '@/app/db'
import { ProjectRow } from '@/app/page'
import Stats from './stats'

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

  return (
    <div className="font-mono min-h-screen flex justify-center items-center flex-col space-y-4">
      <table className="w-120">
        <tbody>
          <ProjectRow project={project!} />
        </tbody>
      </table>
      <Stats stats={stats} />
    </div>
  )
}
