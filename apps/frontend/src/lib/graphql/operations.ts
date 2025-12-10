import { graphqlClient } from '@/lib/graphql/client'
import type { ProfileInput } from '@/lib/validation/profile'

export type UpdateMyProfileInput = Partial<ProfileInput> & {
  onboarding_completed?: boolean
}

const ME_QUERY = `
  query CurrentUser {
    currentUser {
      id
      email
      profile {
        id
        first_name
        last_name
        profile_photo_url
        university_name
        linkedin_url
        location_text
        location_lat
        location_lng
        location_scope
        batch_year
        onboarding_completed
        host_mode
        phone_number
        profile_visibility
        updated_at
      }
    }
  }
` as const

export async function getMe(options?: { skipCache?: boolean }) {
  const res = await graphqlClient
    .query<{
      currentUser: {
        id: string
        email: string
        profile: {
          id: string
          first_name?: string
          last_name?: string
          profile_photo_url?: string
          university_name?: string
          linkedin_url?: string
          location_text?: string
          location_lat?: number
          location_lng?: number
          location_scope?: string
          batch_year?: number
          onboarding_completed?: boolean
          host_mode?: boolean
          phone_number?: string
          profile_visibility?: 'everyone' | 'same_university' | 'same_batch'
          updated_at: string
        } | null
      }
    }>(ME_QUERY, {}, { requestPolicy: options?.skipCache ? 'network-only' : 'cache-first' })
    .toPromise()
  if (res.error) throw res.error
  return res.data?.currentUser ?? null
}

const UPDATE_MY_PROFILE = `
  mutation UpdateMyProfile($input: UpdateProfileInput!) {
    updateMyProfile(input: $input) {
      profile { id first_name last_name profile_photo_url university_name linkedin_url location_text batch_year updated_at }
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
  mutation RequestConnection($targetUserId: ID!) { requestConnection(targetUserId: $targetUserId) { id status } }
` as const

export async function createConnection(targetUserId: string) {
  const res = await graphqlClient
    .mutation<{ requestConnection: { id: string; status: string } }, { targetUserId: string }>(
      CREATE_CONNECTION,
      { targetUserId }
    )
    .toPromise()
  if (res.error) throw res.error
  return res.data!.requestConnection
}

const APPROVE_CONNECTION = `
  mutation AcceptConnection($id: ID!) { acceptConnection(id: $id) { id status } }
` as const
const REJECT_CONNECTION = `
  mutation DenyConnection($id: ID!) { denyConnection(id: $id) { id status } }
` as const

export async function approveConnection(id: string) {
  const res = await graphqlClient.mutation(APPROVE_CONNECTION, { id }).toPromise()
  if (res.error) throw res.error
  return res.data!.acceptConnection
}

export async function rejectConnection(id: string) {
  const res = await graphqlClient.mutation(REJECT_CONNECTION, { id }).toPromise()
  if (res.error) throw res.error
  return res.data!.denyConnection
}

const MY_PENDING = `
  query MyPendingConnections {
    myPendingConnections {
      id
      status
      createdAt
      requester {
        userId
        name
        university
        location
        profilePhotoUrl
        batchYear
        linkedinUrl
        email
      }
    }
  }
` as const

export type PendingConnection = {
  id: string
  status: string
  createdAt: string
  requester: {
    userId: string
    name: string
    university?: string | null
    location?: string | null
    profilePhotoUrl?: string | null
    batchYear?: number | null
    linkedinUrl?: string | null
    email?: string | null
  }
}

export async function getMyPendingConnections(): Promise<PendingConnection[]> {
  const res = await graphqlClient.query<{ myPendingConnections: PendingConnection[] }>(MY_PENDING, {}, { requestPolicy: 'network-only' }).toPromise()
  if (res.error) throw res.error
  return res.data?.myPendingConnections ?? []
}

const MY_OUTGOING_PENDING = `
  query MyOutgoingPendingConnections {
    myOutgoingPendingConnections {
      id
      status
      createdAt
      targetUser {
        userId
        name
        university
        location
        profilePhotoUrl
        batchYear
        linkedinUrl
        email
      }
    }
  }
` as const

export type OutgoingPendingConnection = {
  id: string
  status: string
  createdAt: string
  targetUser: {
    userId: string
    name: string
    university?: string | null
    location?: string | null
    profilePhotoUrl?: string | null
    batchYear?: number | null
    linkedinUrl?: string | null
    email?: string | null
  }
}

export async function getMyOutgoingPendingConnections(): Promise<OutgoingPendingConnection[]> {
  const res = await graphqlClient.query<{ myOutgoingPendingConnections: OutgoingPendingConnection[] }>(MY_OUTGOING_PENDING, {}, { requestPolicy: 'network-only' }).toPromise()
  if (res.error) throw res.error
  return res.data?.myOutgoingPendingConnections ?? []
}

const MY_CONNECTIONS = `
  query MyConnections {
    myConnections {
      userId
      name
      university
      location
      profilePhotoUrl
      batchYear
      linkedinUrl
      email
      connectedAt
    }
  }
` as const

export type ConnectedUser = {
  userId: string
  name: string
  university?: string | null
  location?: string | null
  profilePhotoUrl?: string | null
  batchYear?: number | null
  linkedinUrl?: string | null
  email: string
  connectedAt: string
}

export async function getMyConnections(): Promise<ConnectedUser[]> {
  const res = await graphqlClient.query<{ myConnections: ConnectedUser[] }>(MY_CONNECTIONS, {}, { requestPolicy: 'network-only' }).toPromise()
  if (res.error) throw res.error
  return res.data?.myConnections ?? []
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
  mutation SubmitPrivacyRequest($type: CustomPrivacyRequestType!) { submitPrivacyRequest(type: $type) { id type status created_at } }
` as const

export async function createPrivacyRequest(type: 'deletion' | 'export') {
  const res = await graphqlClient.mutation(CREATE_PRIVACY, { type }).toPromise()
  if (res.error) throw res.error
  return res.data?.submitPrivacyRequest
}
