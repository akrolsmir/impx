'use client'

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'

import { db } from '../db'
import { useState } from 'react'
import { id } from '@instantdb/react'
import { createTxn } from '../actions'
import { buildAmm } from '../math/trade'

export default function Page() {
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
  console.log('BANK', BANK_ID, userId)
  db.transact(
    db.tx.txns[id()]
      .create({
        amount: 1000,
        token: 'USD',
        createdAt: JSON.stringify(new Date()),
      })
      .link({ from: BANK_ID })
      .link({ to: userId })
  )

  // await createTxn({
  //   amount: 1000,
  //   token: 'USD',
  //   from: BANK_ID,
  //   to: userId,
  // })
}

export function UserInfo() {
  const user = db.useUser()
  const { isLoading, data } = db.useQuery({
    profiles: {
      $: {
        where: {
          id: user.id,
        },
      },
      sentTxns: {},
      receivedTxns: {},
      // profile: {},
    },
  })
  if (isLoading) return <>Loading...</>
  const profile = data?.profiles[0]
  // if (!profile) return <>no profile</>

  let balance = 0
  if (profile) {
    balance = buildAmm(profile.receivedTxns, profile.sentTxns).usd
  }

  return (
    <div className="flex flex-col gap-4 font-mono">
      <div className="flex flex-row items-center gap-2">
        <img src={profile?.thumbnail} className="h-8 w-8 rounded" />
        {profile?.name}{' '}
      </div>
      <h1>Balance: ${balance.toFixed(2)}</h1>
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
        onSuccess={async ({ credential }) => {
          const { user } = await db.auth.signInWithIdToken({
            clientName: GOOGLE_CLIENT_NAME,
            idToken: credential!,
            nonce,
          })

          // Save info to profiles
          const parsed = parseIdToken(credential!)
          await db.transact(
            db.tx.profiles[user.id]
              .update({
                name: parsed.name,
                thumbnail: parsed.picture,
              })
              .link({ user: user.id })
          )
        }}
      />
    </GoogleOAuthProvider>
  )
}

type JWTResponse = {
  name: string
  email: string
  picture?: string | undefined
}

function parseIdToken(idToken: string): JWTResponse {
  const base64Payload = idToken.split('.')[1]
  const decoded = Buffer.from(base64Payload, 'base64')
  const parsed = JSON.parse(decoded.toString())
  return parsed
}
