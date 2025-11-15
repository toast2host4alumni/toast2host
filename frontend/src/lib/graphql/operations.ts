import { graphqlClient } from '@/lib/graphql/client'
import type { ProfileInput } from '@/lib/validation/profile'

export type UpdateMyProfileInput = ProfileInput

const UPDATE_MY_PROFILE = `
  mutation UpdateMyProfile($input: UpdateProfileInput!) {
    updateMyProfile(input: $input) {
      profile { id university_name linkedin_url location_text batch_year updated_at }
    }
  }
` as const

export async function updateMyProfile(input: UpdateMyProfileInput) {
  const res = await graphqlClient
    .mutation<{ updateMyProfile: { profile: { id: string } | null } }, { input: UpdateMyProfileInput }>(
      UPDATE_MY_PROFILE,
      { input }
    )
    .toPromise()
  if (res.error) throw res.error
  return res.data?.updateMyProfile.profile ?? null
}

const CREATE_CONNECTION = `
  mutation CreateConnection($targetUserId: ID!) { createConnection(targetUserId: $targetUserId) { id status } }
` as const

export async function createConnection(targetUserId: string) {
  const res = await graphqlClient
    .mutation<{ createConnection: { id: string; status: string } }, { targetUserId: string }>(
      CREATE_CONNECTION,
      { targetUserId }
    )
    .toPromise()
  if (res.error) throw res.error
  return res.data!.createConnection
}

const APPROVE_CONNECTION = `
  mutation ApproveConnection($id: ID!) { approveConnection(id: $id) { id status } }
` as const
const REJECT_CONNECTION = `
  mutation RejectConnection($id: ID!) { rejectConnection(id: $id) { id status } }
` as const

export async function approveConnection(id: string) {
  const res = await graphqlClient.mutation(APPROVE_CONNECTION, { id }).toPromise()
  if (res.error) throw res.error
  return res.data!.approveConnection
}

export async function rejectConnection(id: string) {
  const res = await graphqlClient.mutation(REJECT_CONNECTION, { id }).toPromise()
  if (res.error) throw res.error
  return res.data!.rejectConnection
}

const MY_PENDING = `
  query MyPendingConnections { myPendingConnections { id status } }
` as const

export async function getMyPendingConnections() {
  const res = await graphqlClient.query(MY_PENDING, {}).toPromise()
  if (res.error) throw res.error
  return res.data?.myPendingConnections ?? []
}

const MY_PRIVACY = `
  query MyPrivacyRequests { myPrivacyRequests { id type status created_at completed_at } }
` as const

export async function getMyPrivacyRequests() {
  const res = await graphqlClient.query(MY_PRIVACY, {}).toPromise()
  if (res.error) throw res.error
  return res.data?.myPrivacyRequests ?? []
}

const CREATE_PRIVACY = `
  mutation CreatePrivacyRequest($type: PrivacyRequestType!) { createPrivacyRequest(type: $type) { id type status created_at } }
` as const

export async function createPrivacyRequest(type: 'deletion' | 'export') {
  const res = await graphqlClient.mutation(CREATE_PRIVACY, { type }).toPromise()
  if (res.error) throw res.error
  return res.data?.createPrivacyRequest
}
