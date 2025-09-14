export type Stat = {
  name: string
  value: string
  unit?: string
}

export default function Example(props: { stats: Stat[] }) {
  const { stats } = props
  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-px bg-gray-900/5 sm:grid-cols-2 dark:bg-white/10">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-white px-4 py-6 sm:px-6 lg:px-8 dark:bg-gray-900"
            >
              <p className="text-sm/6 font-medium text-gray-500 dark:text-gray-400">
                {stat.name}
              </p>
              <p className="mt-2 flex items-baseline gap-x-2">
                <span className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  {stat.value}
                </span>
                {stat.unit ? (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {stat.unit}
                  </span>
                ) : null}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
