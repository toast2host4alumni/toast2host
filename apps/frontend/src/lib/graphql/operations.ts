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
        max_guests
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
          max_guests?: number
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
  mutation RequestConnection($targetUserId: ID!, $travel_date_from: String, $travel_date_to: String, $guests: Int) {
    requestConnection(targetUserId: $targetUserId, travel_date_from: $travel_date_from, travel_date_to: $travel_date_to, guests: $guests) { id status }
  }
` as const

export type CreateConnectionOptions = {
  travel_date_from?: string
  travel_date_to?: string
  guests?: number
}

export async function createConnection(targetUserId: string, options?: CreateConnectionOptions) {
  const res = await graphqlClient
    .mutation<{ requestConnection: { id: string; status: string } }, { targetUserId: string } & CreateConnectionOptions>(
      CREATE_CONNECTION,
      { targetUserId, ...options }
    )
    .toPromise()
  if (res.error) throw res.error
  return res.data!.requestConnection
}

const APPROVE_CONNECTION = `
  mutation AcceptConnection($id: ID!) { acceptConnection(id: $id) { id status autoRejectedIds } }
` as const
const REJECT_CONNECTION = `
  mutation DenyConnection($id: ID!) { denyConnection(id: $id) { id status } }
` as const
const CANCEL_CONNECTION = `
  mutation CancelConnection($id: ID!) { cancelConnection(id: $id) { id status } }
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

export async function cancelConnection(id: string) {
  const res = await graphqlClient.mutation(CANCEL_CONNECTION, { id }).toPromise()
  if (res.error) throw res.error
  return res.data!.cancelConnection
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
      travelDateFrom
      travelDateTo
      guestCount
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
  travelDateFrom?: string | null
  travelDateTo?: string | null
  guestCount?: number | null
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
      travelDateFrom
      travelDateTo
      guestCount
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
  travelDateFrom?: string | null
  travelDateTo?: string | null
  guestCount?: number | null
}

export async function getMyOutgoingPendingConnections(): Promise<OutgoingPendingConnection[]> {
  const res = await graphqlClient.query<{ myOutgoingPendingConnections: OutgoingPendingConnection[] }>(MY_OUTGOING_PENDING, {}, { requestPolicy: 'network-only' }).toPromise()
  if (res.error) throw res.error
  return res.data?.myOutgoingPendingConnections ?? []
}

const CONFIRMED_BOOKING_FIELDS = `
  id
  status
  createdAt
  confirmedAt
  otherUser {
    userId
    name
    university
    location
    profilePhotoUrl
    batchYear
    linkedinUrl
    email
  }
  travelDateFrom
  travelDateTo
  guestCount
` as const

const MY_HOSTED_BOOKINGS = `
  query MyHostedBookings {
    myHostedBookings { ${CONFIRMED_BOOKING_FIELDS} }
  }
` as const

const MY_TRIPS = `
  query MyTrips {
    myTrips { ${CONFIRMED_BOOKING_FIELDS} }
  }
` as const

export type ConfirmedBooking = {
  id: string
  status: string
  createdAt: string
  confirmedAt?: string | null
  otherUser: {
    userId: string
    name: string
    university?: string | null
    location?: string | null
    profilePhotoUrl?: string | null
    batchYear?: number | null
    linkedinUrl?: string | null
    email?: string | null
  }
  travelDateFrom?: string | null
  travelDateTo?: string | null
  guestCount?: number | null
}

export async function getMyHostedBookings(): Promise<ConfirmedBooking[]> {
  const res = await graphqlClient.query<{ myHostedBookings: ConfirmedBooking[] }>(MY_HOSTED_BOOKINGS, {}, { requestPolicy: 'network-only' }).toPromise()
  if (res.error) throw res.error
  return res.data?.myHostedBookings ?? []
}

export async function getMyTrips(): Promise<ConfirmedBooking[]> {
  const res = await graphqlClient.query<{ myTrips: ConfirmedBooking[] }>(MY_TRIPS, {}, { requestPolicy: 'network-only' }).toPromise()
  if (res.error) throw res.error
  return res.data?.myTrips ?? []
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
