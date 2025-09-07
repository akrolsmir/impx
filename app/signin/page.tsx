'use client'

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'

import { db } from '../db'
import { useState } from 'react'
import { id } from '@instantdb/react'
import { createTxn } from '../actions'

export default function Page() {
  // Create the authorization URL:
  const url = db.auth.createAuthorizationURL({
    clientName: 'google-web',
    redirectURL: 'localhost:3000',
  })

  return (
    <div className="flex flex-col gap-4 min-h-screen justify-center items-center">
      <div className="flex flex-col gap-4 outline p-8 rounded-md ">
        <db.SignedIn>
          <UserInfo />
        </db.SignedIn>
        <db.SignedOut>
          <Login />
        </db.SignedOut>
      </div>
    </div>
  )
}

const BANK_ID = '11a79ed5-256d-4a04-ba23-f1202667b730' // id for austin@manifund.org

async function claim(userId: string) {
  // console.log('BANK', BANK_ID, userId)
  // db.transact(
  //   db.tx.txns[id()]
  //     .create({
  //       amount: 1000,
  //       token: 'USD',
  //     })
  //     // .link({ from: '11a79ed5-256d-4a04-ba23-f1202667b730' })
  //     .link({ to: userId })
  //   // .link({ projects: '760586e4-4c35-4f50-ab1e-5c714f4d1bbf' })
  // )

  await createTxn({
    amount: 1000,
    token: 'USD',
    from: BANK_ID,
    to: userId,
  })
}

function UserInfo() {
  const user = db.useUser()
  const { isLoading, data } = db.useQuery({
    $users: {
      $: {
        where: {
          id: user.id,
        },
      },
      sentTxns: {},
      receivedTxns: {},
    },
  })
  if (isLoading) return <>Loading...</>
  const { sentTxns, receivedTxns } = data?.$users[0]!

  // Hack: get balance. Should check for USD.
  let balance = 0
  receivedTxns.forEach((txn) => {
    balance += txn.amount
  })
  sentTxns.forEach((txn) => {
    balance -= txn.amount
  })

  return (
    <div className="flex flex-col gap-4 font-mono">
      <h1>
        Hello {user.email}! <br />
        Your balance is ${balance}
      </h1>
      <button
        className="outline outline-gray-200 bg-gray-50 rounded-md p-2 cursor-pointer"
        onClick={() => claim(user.id)}
      >
        Claim $1000
      </button>

      <button
        className="outline outline-red-200 bg-red-50 rounded-md p-2 cursor-pointer "
        onClick={() => db.auth.signOut()}
      >
        Sign out
      </button>
    </div>
  )
}

const GOOGLE_CLIENT_NAME = 'google-web'
const GOOGLE_CLIENT_ID =
  '698891181299-bj23u4s4r9j8qkonbd3um71o5lfogo29.apps.googleusercontent.com'

function Login() {
  const [nonce] = useState(crypto.randomUUID())

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleLogin
        nonce={nonce}
        onError={() => alert('Login failed')}
        onSuccess={({ credential }) => {
          db.auth
            .signInWithIdToken({
              clientName: GOOGLE_CLIENT_NAME,
              idToken: credential!,
              // Make sure this is the same nonce you passed as a prop
              // to the GoogleLogin button
              nonce,
            })
            .catch((err) => {
              alert('Uh oh: ' + err.body?.message)
            })
        }}
      />
    </GoogleOAuthProvider>
  )
}
