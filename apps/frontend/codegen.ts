import type { CodegenConfig } from '@graphql-codegen/cli'

const STRAPI_URL = process.env.VITE_STRAPI_URL

const config: CodegenConfig = {
  schema: `${STRAPI_URL}/graphql`,
  documents: ['src/**/*.{ts,tsx}', '../specs/001-alumni-connect-mvp/contracts/operations.graphql'],
  generates: {
    'src/lib/graphql/generated.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-urql'],
      config: {
        withHooks: false,
      },
    },
  },
}

export default config

