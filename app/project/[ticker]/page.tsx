'use client'
import { use } from 'react'
import { db } from '@/app/db'
import { ProjectRow } from '@/app/page'

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

  return (
    <table>
      <ProjectRow project={project} />
    </table>
  )
}
