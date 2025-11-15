/* Stub GraphQL schema/resolvers extension for Strapi GraphQL plugin */
import meResolvers from '../resolvers/me'
import profileResolvers from '../resolvers/profile'
import universitiesResolvers from '../resolvers/universities'
import searchResolvers from '../resolvers/search'
import connectionResolvers from '../resolvers/connection'
import privacyResolvers from '../resolvers/privacy'

const typeDefs = /* GraphQL */ `
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

  enum PrivacyRequestType {
    deletion
    export
  }

  type UserProfile {
    id: ID!
    university_name: String!
    linkedin_url: String!
    location_text: String!
    location_lat: Float
    location_lng: Float
    location_scope: LocationScope
    batch_year: Int
    updated_at: String
  }

  type Me {
    id: ID!
    email: String!
    profile: UserProfile
  }

  type University {
    name: String!
    state: String
    country: String
    external_id: String
  }

  type SearchUserResult {
    userId: ID!
    name: String
    university: String
    location: String
    connectionStatus: String
    email: String
  }

  input UpdateProfileInput {
    university_name: String!
    linkedin_url: String!
    location_text: String!
    location_lat: Float
    location_lng: Float
    location_scope: LocationScope
    batch_year: Int
  }

  type UpdateProfilePayload {
    profile: UserProfile
  }

  type Connection {
    id: ID!
    status: String!
  }

  type PrivacyRequest {
    id: ID!
    type: PrivacyRequestType!
    status: String!
    created_at: String
    completed_at: String
  }

  extend type Query {
    me: Me
    universitiesUS(q: String): [University!]!
    searchUsers(
      location: String
      lat: Float
      lng: Float
      scope: LocationScope
      university: String
      batch_year: Int
      sort: SearchSort
      not_connected_only: Boolean
      name: String
      page: Int
      pageSize: Int
    ): [SearchUserResult!]!
    myPendingConnections: [Connection!]!
    myPrivacyRequests: [PrivacyRequest!]!
  }

  extend type Mutation {
    updateMyProfile(input: UpdateProfileInput!): UpdateProfilePayload!
    createConnection(targetUserId: ID!): Connection!
    approveConnection(id: ID!): Connection!
    rejectConnection(id: ID!): Connection!
    createPrivacyRequest(type: PrivacyRequestType!): PrivacyRequest!
  }
`

export default {
  typeDefs,
  resolvers: {
    Query: {
      ...meResolvers.Query,
      ...universitiesResolvers.Query,
      ...searchResolvers.Query,
      ...connectionResolvers.Query,
      ...privacyResolvers.Query,
    },
    Mutation: {
      ...profileResolvers.Mutation,
      ...connectionResolvers.Mutation,
      ...privacyResolvers.Mutation,
    },
  },
}
