import graphqlSchema from './extensions/graphql/config/schema';

const mockUsers = [
  { first_name: 'Alice', last_name: 'Johnson', email: 'alice.johnson@example.com', university_name: 'Stanford University', location_text: 'San Francisco, CA', location_lat: 37.7749, location_lng: -122.4194, location_scope: 'city', batch_year: 2020, profile_photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Bob', last_name: 'Smith', email: 'bob.smith@example.com', university_name: 'MIT', location_text: 'Boston, MA', location_lat: 42.3601, location_lng: -71.0589, location_scope: 'city', batch_year: 2019, profile_photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Carol', last_name: 'Williams', email: 'carol.williams@example.com', university_name: 'Harvard University', location_text: 'Cambridge, MA', location_lat: 42.3736, location_lng: -71.1097, location_scope: 'city', batch_year: 2021, profile_photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'David', last_name: 'Brown', email: 'david.brown@example.com', university_name: 'UC Berkeley', location_text: 'Berkeley, CA', location_lat: 37.8716, location_lng: -122.2727, location_scope: 'city', batch_year: 2018, profile_photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Eva', last_name: 'Martinez', email: 'eva.martinez@example.com', university_name: 'UCLA', location_text: 'Los Angeles, CA', location_lat: 34.0522, location_lng: -118.2437, location_scope: 'city', batch_year: 2022, profile_photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Frank', last_name: 'Garcia', email: 'frank.garcia@example.com', university_name: 'Yale University', location_text: 'New Haven, CT', location_lat: 41.3083, location_lng: -72.9279, location_scope: 'city', batch_year: 2020, profile_photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Grace', last_name: 'Lee', email: 'grace.lee@example.com', university_name: 'Princeton University', location_text: 'Princeton, NJ', location_lat: 40.3573, location_lng: -74.6672, location_scope: 'city', batch_year: 2019, profile_photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Henry', last_name: 'Wilson', email: 'henry.wilson@example.com', university_name: 'Columbia University', location_text: 'New York, NY', location_lat: 40.7128, location_lng: -74.006, location_scope: 'city', batch_year: 2021, profile_photo_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Iris', last_name: 'Anderson', email: 'iris.anderson@example.com', university_name: 'University of Chicago', location_text: 'Chicago, IL', location_lat: 41.8781, location_lng: -87.6298, location_scope: 'city', batch_year: 2020, profile_photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Jack', last_name: 'Taylor', email: 'jack.taylor@example.com', university_name: 'Duke University', location_text: 'Durham, NC', location_lat: 35.9940, location_lng: -78.8986, location_scope: 'city', batch_year: 2018, profile_photo_url: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Karen', last_name: 'Thomas', email: 'karen.thomas@example.com', university_name: 'Northwestern University', location_text: 'Evanston, IL', location_lat: 42.0451, location_lng: -87.6877, location_scope: 'city', batch_year: 2022, profile_photo_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Leo', last_name: 'Jackson', email: 'leo.jackson@example.com', university_name: 'Johns Hopkins University', location_text: 'Baltimore, MD', location_lat: 39.2904, location_lng: -76.6122, location_scope: 'city', batch_year: 2019, profile_photo_url: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Mia', last_name: 'White', email: 'mia.white@example.com', university_name: 'University of Pennsylvania', location_text: 'Philadelphia, PA', location_lat: 39.9526, location_lng: -75.1652, location_scope: 'city', batch_year: 2021, profile_photo_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Nathan', last_name: 'Harris', email: 'nathan.harris@example.com', university_name: 'Caltech', location_text: 'Pasadena, CA', location_lat: 34.1478, location_lng: -118.1445, location_scope: 'city', batch_year: 2020, profile_photo_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Olivia', last_name: 'Martin', email: 'olivia.martin@example.com', university_name: 'Cornell University', location_text: 'Ithaca, NY', location_lat: 42.4440, location_lng: -76.5019, location_scope: 'city', batch_year: 2018, profile_photo_url: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Paul', last_name: 'Thompson', email: 'paul.thompson@example.com', university_name: 'University of Michigan', location_text: 'Ann Arbor, MI', location_lat: 42.2808, location_lng: -83.7430, location_scope: 'city', batch_year: 2022, profile_photo_url: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Quinn', last_name: 'Robinson', email: 'quinn.robinson@example.com', university_name: 'Carnegie Mellon University', location_text: 'Pittsburgh, PA', location_lat: 40.4406, location_lng: -79.9959, location_scope: 'city', batch_year: 2019, profile_photo_url: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Rachel', last_name: 'Clark', email: 'rachel.clark@example.com', university_name: 'Georgia Tech', location_text: 'Atlanta, GA', location_lat: 33.7490, location_lng: -84.3880, location_scope: 'city', batch_year: 2021, profile_photo_url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Sam', last_name: 'Lewis', email: 'sam.lewis@example.com', university_name: 'University of Texas at Austin', location_text: 'Austin, TX', location_lat: 30.2672, location_lng: -97.7431, location_scope: 'city', batch_year: 2020, profile_photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Tina', last_name: 'Walker', email: 'tina.walker@example.com', university_name: 'University of Washington', location_text: 'Seattle, WA', location_lat: 47.6062, location_lng: -122.3321, location_scope: 'city', batch_year: 2018, profile_photo_url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Uma', last_name: 'Hall', email: 'uma.hall@example.com', university_name: 'Boston University', location_text: 'Boston, MA', location_lat: 42.3505, location_lng: -71.1054, location_scope: 'city', batch_year: 2022, profile_photo_url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Victor', last_name: 'Allen', email: 'victor.allen@example.com', university_name: 'NYU', location_text: 'New York, NY', location_lat: 40.7291, location_lng: -73.9965, location_scope: 'city', batch_year: 2019, profile_photo_url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Wendy', last_name: 'Young', email: 'wendy.young@example.com', university_name: 'USC', location_text: 'Los Angeles, CA', location_lat: 34.0224, location_lng: -118.2851, location_scope: 'city', batch_year: 2021, profile_photo_url: 'https://images.unsplash.com/photo-1485875437342-9b39470b3d95?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Xavier', last_name: 'King', email: 'xavier.king@example.com', university_name: 'Vanderbilt University', location_text: 'Nashville, TN', location_lat: 36.1627, location_lng: -86.7816, location_scope: 'city', batch_year: 2020, profile_photo_url: 'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=150&h=150&fit=crop&crop=face' },
  { first_name: 'Yuki', last_name: 'Wright', email: 'yuki.wright@example.com', university_name: 'Rice University', location_text: 'Houston, TX', location_lat: 29.7604, location_lng: -95.3698, location_scope: 'city', batch_year: 2018, profile_photo_url: 'https://images.unsplash.com/photo-1546961342-ea5f71b193f3?w=150&h=150&fit=crop&crop=face' },
]

export default {
  register({ strapi }: any) {
    // Register custom GraphQL schema and resolvers
    const extensionService = strapi.plugin('graphql').service('extension');

    extensionService.use({
      typeDefs: graphqlSchema.typeDefs,
      resolvers: graphqlSchema.resolvers,
    });
  },

  async bootstrap({ strapi }: any) {
    // Seed mock users only in development
    if (process.env.NODE_ENV !== 'production') {
      const existingCount = await strapi.entityService.count('plugin::users-permissions.user')
      console.log(`Found ${existingCount} existing users`)

      // Update existing profiles with photos
      console.log('Updating profiles with photos...')
      for (const mockUser of mockUsers) {
        try {
          const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
            filters: { email: mockUser.email },
            limit: 1,
          })
          if (users && users[0]) {
            const profiles = await strapi.entityService.findMany('api::user-profile.user-profile', {
              filters: { user: users[0].id },
              limit: 1,
            })
            if (profiles && profiles[0]) {
              await strapi.entityService.update('api::user-profile.user-profile', profiles[0].id, {
                data: { profile_photo_url: mockUser.profile_photo_url },
              })
              console.log(`Updated photo for: ${mockUser.first_name} ${mockUser.last_name}`)
            }
          }
        } catch (err: any) {
          // Ignore errors for existing users
        }
      }

      if (existingCount < 26) {
        console.log('Seeding 25 mock users...')
        for (const mockUser of mockUsers) {
          try {
            // Create user
            const user = await strapi.entityService.create('plugin::users-permissions.user', {
              data: {
                username: mockUser.email.split('@')[0],
                email: mockUser.email,
                password: 'TestPass123!',
                provider: 'local',
                confirmed: true,
                blocked: false,
                role: 1, // Authenticated role
              },
            })
            // Create profile
            await strapi.entityService.create('api::user-profile.user-profile', {
              data: {
                user: user.id,
                first_name: mockUser.first_name,
                last_name: mockUser.last_name,
                profile_photo_url: mockUser.profile_photo_url,
                university_name: mockUser.university_name,
                linkedin_url: `https://linkedin.com/in/${mockUser.first_name.toLowerCase()}${mockUser.last_name.toLowerCase()}`,
                location_text: mockUser.location_text,
                location_lat: mockUser.location_lat,
                location_lng: mockUser.location_lng,
                location_scope: mockUser.location_scope,
                batch_year: mockUser.batch_year,
              },
            })
            console.log(`Created user: ${mockUser.first_name} ${mockUser.last_name}`)
          } catch (err: any) {
            if (!err.message?.includes('already taken')) {
              console.error(`Failed to create ${mockUser.email}:`, err.message)
            }
          }
        }
        console.log('Seeding complete!')
      }
    }
  },
};
