// Seed script for creating 25 mock user profiles
// Run with: npx ts-node scripts/seed-users.ts

const mockUsers = [
  { first_name: 'Alice', last_name: 'Johnson', email: 'alice.johnson@example.com', university_name: 'Stanford University', location_text: 'San Francisco, CA', location_lat: 37.7749, location_lng: -122.4194, location_scope: 'city', batch_year: 2020 },
  { first_name: 'Bob', last_name: 'Smith', email: 'bob.smith@example.com', university_name: 'MIT', location_text: 'Boston, MA', location_lat: 42.3601, location_lng: -71.0589, location_scope: 'city', batch_year: 2019 },
  { first_name: 'Carol', last_name: 'Williams', email: 'carol.williams@example.com', university_name: 'Harvard University', location_text: 'Cambridge, MA', location_lat: 42.3736, location_lng: -71.1097, location_scope: 'city', batch_year: 2021 },
  { first_name: 'David', last_name: 'Brown', email: 'david.brown@example.com', university_name: 'UC Berkeley', location_text: 'Berkeley, CA', location_lat: 37.8716, location_lng: -122.2727, location_scope: 'city', batch_year: 2018 },
  { first_name: 'Eva', last_name: 'Martinez', email: 'eva.martinez@example.com', university_name: 'UCLA', location_text: 'Los Angeles, CA', location_lat: 34.0522, location_lng: -118.2437, location_scope: 'city', batch_year: 2022 },
  { first_name: 'Frank', last_name: 'Garcia', email: 'frank.garcia@example.com', university_name: 'Yale University', location_text: 'New Haven, CT', location_lat: 41.3083, location_lng: -72.9279, location_scope: 'city', batch_year: 2020 },
  { first_name: 'Grace', last_name: 'Lee', email: 'grace.lee@example.com', university_name: 'Princeton University', location_text: 'Princeton, NJ', location_lat: 40.3573, location_lng: -74.6672, location_scope: 'city', batch_year: 2019 },
  { first_name: 'Henry', last_name: 'Wilson', email: 'henry.wilson@example.com', university_name: 'Columbia University', location_text: 'New York, NY', location_lat: 40.7128, location_lng: -74.006, location_scope: 'city', batch_year: 2021 },
  { first_name: 'Iris', last_name: 'Anderson', email: 'iris.anderson@example.com', university_name: 'University of Chicago', location_text: 'Chicago, IL', location_lat: 41.8781, location_lng: -87.6298, location_scope: 'city', batch_year: 2020 },
  { first_name: 'Jack', last_name: 'Taylor', email: 'jack.taylor@example.com', university_name: 'Duke University', location_text: 'Durham, NC', location_lat: 35.9940, location_lng: -78.8986, location_scope: 'city', batch_year: 2018 },
  { first_name: 'Karen', last_name: 'Thomas', email: 'karen.thomas@example.com', university_name: 'Northwestern University', location_text: 'Evanston, IL', location_lat: 42.0451, location_lng: -87.6877, location_scope: 'city', batch_year: 2022 },
  { first_name: 'Leo', last_name: 'Jackson', email: 'leo.jackson@example.com', university_name: 'Johns Hopkins University', location_text: 'Baltimore, MD', location_lat: 39.2904, location_lng: -76.6122, location_scope: 'city', batch_year: 2019 },
  { first_name: 'Mia', last_name: 'White', email: 'mia.white@example.com', university_name: 'University of Pennsylvania', location_text: 'Philadelphia, PA', location_lat: 39.9526, location_lng: -75.1652, location_scope: 'city', batch_year: 2021 },
  { first_name: 'Nathan', last_name: 'Harris', email: 'nathan.harris@example.com', university_name: 'Caltech', location_text: 'Pasadena, CA', location_lat: 34.1478, location_lng: -118.1445, location_scope: 'city', batch_year: 2020 },
  { first_name: 'Olivia', last_name: 'Martin', email: 'olivia.martin@example.com', university_name: 'Cornell University', location_text: 'Ithaca, NY', location_lat: 42.4440, location_lng: -76.5019, location_scope: 'city', batch_year: 2018 },
  { first_name: 'Paul', last_name: 'Thompson', email: 'paul.thompson@example.com', university_name: 'University of Michigan', location_text: 'Ann Arbor, MI', location_lat: 42.2808, location_lng: -83.7430, location_scope: 'city', batch_year: 2022 },
  { first_name: 'Quinn', last_name: 'Robinson', email: 'quinn.robinson@example.com', university_name: 'Carnegie Mellon University', location_text: 'Pittsburgh, PA', location_lat: 40.4406, location_lng: -79.9959, location_scope: 'city', batch_year: 2019 },
  { first_name: 'Rachel', last_name: 'Clark', email: 'rachel.clark@example.com', university_name: 'Georgia Tech', location_text: 'Atlanta, GA', location_lat: 33.7490, location_lng: -84.3880, location_scope: 'city', batch_year: 2021 },
  { first_name: 'Sam', last_name: 'Lewis', email: 'sam.lewis@example.com', university_name: 'University of Texas at Austin', location_text: 'Austin, TX', location_lat: 30.2672, location_lng: -97.7431, location_scope: 'city', batch_year: 2020 },
  { first_name: 'Tina', last_name: 'Walker', email: 'tina.walker@example.com', university_name: 'University of Washington', location_text: 'Seattle, WA', location_lat: 47.6062, location_lng: -122.3321, location_scope: 'city', batch_year: 2018 },
  { first_name: 'Uma', last_name: 'Hall', email: 'uma.hall@example.com', university_name: 'Boston University', location_text: 'Boston, MA', location_lat: 42.3505, location_lng: -71.1054, location_scope: 'city', batch_year: 2022 },
  { first_name: 'Victor', last_name: 'Allen', email: 'victor.allen@example.com', university_name: 'NYU', location_text: 'New York, NY', location_lat: 40.7291, location_lng: -73.9965, location_scope: 'city', batch_year: 2019 },
  { first_name: 'Wendy', last_name: 'Young', email: 'wendy.young@example.com', university_name: 'USC', location_text: 'Los Angeles, CA', location_lat: 34.0224, location_lng: -118.2851, location_scope: 'city', batch_year: 2021 },
  { first_name: 'Xavier', last_name: 'King', email: 'xavier.king@example.com', university_name: 'Vanderbilt University', location_text: 'Nashville, TN', location_lat: 36.1627, location_lng: -86.7816, location_scope: 'city', batch_year: 2020 },
  { first_name: 'Yuki', last_name: 'Wright', email: 'yuki.wright@example.com', university_name: 'Rice University', location_text: 'Houston, TX', location_lat: 29.7604, location_lng: -95.3698, location_scope: 'city', batch_year: 2018 },
]

export default mockUsers
