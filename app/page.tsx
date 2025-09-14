'use client'

import Link from 'next/link'
import { db, Project } from './db'
import { UserInfo } from './signin/page'
import { buildAmm, price } from './math/trade'

function App() {
  // Read Data - Get projects and their AMM profiles
  const { isLoading, error, data } = db.useQuery({
    projects: {},
    profiles: {
      $: { where: { name: { $like: '%-AMM' } } },
      sentTxns: {},
      receivedTxns: {},
    },
  })
  if (isLoading) {
    return
  }
  if (error) {
    throw error
  }
  const { projects, profiles } = data
  return (
    <div className="font-mono min-h-screen flex justify-center items-center flex-col space-y-4">
      <div className="absolute top-2 right-2">
        <db.SignedIn>
          <div className="outline outline-gray-200 p-4 rounded">
            <UserInfo />
          </div>
        </db.SignedIn>
        <db.SignedOut>
          <Link href="/signin">Sign in</Link>{' '}
        </db.SignedOut>
      </div>
      <h2 className="tracking-wide text-5xl text-gray-300">
        impx: impact exchange
      </h2>
      <div className="border border-gray-300 max-w-xs w-full"></div>
      <table className="table-auto w-160">
        <tbody>
          {projects.map((project) => {
            return (
              <ProjectRow
                key={project.id}
                project={project}
                profiles={profiles}
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function ProjectRow(props: { project: Project; profiles: any[] }) {
  const { project, profiles } = props

  // Find the AMM profile for this project
  const ammProfile = profiles?.find(
    (profile) => profile.name === `${project.ticker}-AMM`
  )

  // Calculate the real-time price using AMM data
  let currentPrice = 0
  if (ammProfile?.receivedTxns && ammProfile?.sentTxns) {
    const amm = buildAmm(
      ammProfile.receivedTxns,
      ammProfile.sentTxns,
      project.ticker
    )
    if (amm.shares > 0) {
      currentPrice = price(amm)
    }
  }

  return (
    <tr className="">
      <td>
        <img src={project.thumbnail} className="w-8 h-8 m-1" />
      </td>
      <td>{project.title}</td>
      <td>{project.ticker}</td>
      <td>${currentPrice.toFixed(0)}/share</td>
      <td>
        <Link
          className="outline py-1 px-2 hover:bg-green-100 hover:cursor-pointer"
          href={`/project/${project.ticker}`}
        >
          Buy
        </Link>
      </td>
    </tr>
  )
}

/**
// Write Data
// ---------
function addTodo(text: string) {
  db.transact(
    db.tx.todos[id()].update({
      text,
      done: false,
      createdAt: Date.now(),
    })
  )
}

function deleteTodo(todo: Todo) {
  db.transact(db.tx.todos[todo.id].delete())
}

function toggleDone(todo: Todo) {
  db.transact(db.tx.todos[todo.id].update({ done: !todo.done }))
}

function deleteCompleted(todos: Todo[]) {
  const completed = todos.filter((todo) => todo.done)
  const txs = completed.map((todo) => db.tx.todos[todo.id].delete())
  db.transact(txs)
}

function toggleAll(todos: Todo[]) {
  const newVal = !todos.every((todo) => todo.done)
  db.transact(
    todos.map((todo) => db.tx.todos[todo.id].update({ done: newVal }))
  )
}

// Components
// ----------
function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20">
      <path
        d="M5 8 L10 13 L15 8"
        stroke="currentColor"
        fill="none"
        strokeWidth="2"
      />
    </svg>
  )
}

function TodoForm({ todos }: { todos: Todo[] }) {
  return (
    <div className="flex items-center h-10 border-b border-gray-300">
      <button
        className="h-full px-2 border-r border-gray-300 flex items-center justify-center"
        onClick={() => toggleAll(todos)}
      >
        <div className="w-5 h-5">
          <ChevronDownIcon />
        </div>
      </button>
      <form
        className="flex-1 h-full"
        onSubmit={(e) => {
          e.preventDefault()
          const input = e.currentTarget.input as HTMLInputElement
          addTodo(input.value)
          input.value = ''
        }}
      >
        <input
          className="w-full h-full px-2 outline-none bg-transparent"
          autoFocus
          placeholder="What needs to be done?"
          type="text"
          name="input"
        />
      </form>
    </div>
  )
}

function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <div className="divide-y divide-gray-300">
      {todos.map((todo) => (
        <div key={todo.id} className="flex items-center h-10">
          <div className="h-full px-2 flex items-center justify-center">
            <div className="w-5 h-5 flex items-center justify-center">
              <input
                type="checkbox"
                className="cursor-pointer"
                checked={todo.done}
                onChange={() => toggleDone(todo)}
              />
            </div>
          </div>
          <div className="flex-1 px-2 overflow-hidden flex items-center">
            {todo.done ? (
              <span className="line-through">{todo.text}</span>
            ) : (
              <span>{todo.text}</span>
            )}
          </div>
          <button
            className="h-full px-2 flex items-center justify-center text-gray-300 hover:text-gray-500"
            onClick={() => deleteTodo(todo)}
          >
            X
          </button>
        </div>
      ))}
    </div>
  )
}

function ActionBar({ todos }: { todos: Todo[] }) {
  return (
    <div className="flex justify-between items-center h-10 px-2 text-xs border-t border-gray-300">
      <div>Remaining todos: {todos.filter((todo) => !todo.done).length}</div>
      <button
        className=" text-gray-300 hover:text-gray-500"
        onClick={() => deleteCompleted(todos)}
      >
        Delete Completed
      </button>
    </div>
  )
}
 */
export default App
