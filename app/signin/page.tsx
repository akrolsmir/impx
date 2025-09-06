'use client'

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'

import { db } from '../db'
import { useState } from 'react'

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
          <button
            className="outline bg-gray-50 rounded-md p-2 cursor-pointer"
            onClick={() => db.auth.signOut()}
          >
            Sign out
          </button>
        </db.SignedIn>
        {/* <db.SignedOut> */}
        <Login />
        {/* </db.SignedOut> */}
      </div>
    </div>
  )
}

function UserInfo() {
  const user = db.useUser()
  return <h1>Hello {user.email}!</h1>
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
