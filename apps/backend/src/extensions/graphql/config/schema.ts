/* Stub GraphQL schema/resolvers extension for Strapi GraphQL plugin */
import meResolvers from '../resolvers/me'
import profileResolvers from '../resolvers/profile'
import universitiesResolvers from '../resolvers/universities'
import searchResolvers from '../resolvers/search'
import connectionResolvers from '../resolvers/connection'
import privacyResolvers from '../resolvers/privacy'

const typeDefs = /* GraphQL */ `
  type University {
    name: String!
    state: String
    country: String
    external_id: String
  }

  input UpdateProfileInput {
    first_name: String
    last_name: String
    profile_photo_url: String
    university_name: String
    linkedin_url: String
    location_text: String
    location_lat: Float
    location_lng: Float
    location_scope: String
    batch_year: Int
    onboarding_completed: Boolean
    host_mode: Boolean
    max_guests: Int
    phone_number: String
    profile_visibility: String
  }

  type UpdatedProfileData {
    id: ID!
    first_name: String
    last_name: String
    profile_photo_url: String
    university_name: String
    linkedin_url: String
    location_text: String
    location_lat: Float
    location_lng: Float
    location_scope: String
    batch_year: Int
    onboarding_completed: Boolean
    host_mode: Boolean
    max_guests: Int
    phone_number: String
    profile_visibility: String
    updated_at: String
  }

  type UpdateProfileResult {
    profile: UpdatedProfileData
  }

  type MeProfile {
    id: ID!
    first_name: String
    last_name: String
    profile_photo_url: String
    university_name: String
    linkedin_url: String
    location_text: String
    location_lat: Float
    location_lng: Float
    location_scope: String
    batch_year: Int
    onboarding_completed: Boolean
    host_mode: Boolean
    max_guests: Int
    phone_number: String
    profile_visibility: String
    updated_at: String
  }

  type MeResult {
    id: ID!
    email: String!
    profile: MeProfile
  }

  type CustomPrivacyRequest {
    id: ID!
    type: String!
    status: String!
    created_at: String!
    completed_at: String
  }

  type ConnectionRequester {
    userId: ID!
    name: String!
    university: String
    location: String
    profilePhotoUrl: String
    batchYear: Int
    linkedinUrl: String
    email: String
  }

  type CustomConnection {
    id: ID!
    status: String!
    # Only populated by acceptConnection - ids of other pending requests for the
    # same host/overlapping dates that were auto-rejected as a result.
    autoRejectedIds: [ID!]
  }

  type PendingConnectionRequest {
    id: ID!
    status: String!
    createdAt: String!
    requester: ConnectionRequester!
    travelDateFrom: String
    travelDateTo: String
    guestCount: Int
  }

  type OutgoingPendingConnection {
    id: ID!
    status: String!
    createdAt: String!
    targetUser: ConnectionRequester!
    travelDateFrom: String
    travelDateTo: String
    guestCount: Int
  }

  type ConfirmedBooking {
    id: ID!
    status: String!
    createdAt: String!
    confirmedAt: String
    otherUser: ConnectionRequester!
    travelDateFrom: String
    travelDateTo: String
    guestCount: Int
  }

  enum CustomPrivacyRequestType {
    deletion
    export
  }

  enum LocationScope {
    city
    state
    country
  }

  enum SearchSort {
    proximity
    recent
    name
  }

  type SearchUserResult {
    userId: ID!
    name: String
    university: String
    location: String
    connectionStatus: String!
    email: String
    profilePhotoUrl: String
    batchYear: Int
    proximityMiles: Float
    hostMode: Boolean
    maxGuests: Int
  }

  extend type Query {
    universitiesUS(q: String): [University!]!
    currentUser: MeResult
    myPrivacyRequests: [CustomPrivacyRequest!]!
    myPendingConnections: [PendingConnectionRequest!]!
    myOutgoingPendingConnections: [OutgoingPendingConnection!]!
    myHostedBookings: [ConfirmedBooking!]!
    myTrips: [ConfirmedBooking!]!
    searchUsers(
      location: String
      lat: Float
      lng: Float
      scope: LocationScope
      university: String
      universities: [String!]
      batch_year: Int
      sort: SearchSort
      connected_only: Boolean
      name: String
      page: Int
      pageSize: Int
      hosts_only: Boolean
      guests: Int
    ): [SearchUserResult!]!
  }

  extend type Mutation {
    updateMyProfile(input: UpdateProfileInput!): UpdateProfileResult!
    submitPrivacyRequest(type: CustomPrivacyRequestType!): CustomPrivacyRequest!
    requestConnection(targetUserId: ID!, travel_date_from: String, travel_date_to: String, guests: Int): CustomConnection!
    acceptConnection(id: ID!): CustomConnection!
    denyConnection(id: ID!): CustomConnection!
    cancelConnection(id: ID!): CustomConnection!
  }
`

export default {
  typeDefs,
  resolvers: {
    Query: {
      ...universitiesResolvers.Query,
      ...meResolvers.Query,
      ...privacyResolvers.Query,
      ...connectionResolvers.Query,
      ...searchResolvers.Query,
    },
    Mutation: {
      ...profileResolvers.Mutation,
      ...privacyResolvers.Mutation,
      ...connectionResolvers.Mutation,
    },
  },
}
