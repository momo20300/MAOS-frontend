// eslint.config.mjs
import { defineConfig, globalIgnores } from 'eslint/config'
import nextConfig from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  ...nextConfig,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts'
  ]),
  {
    rules: {
      // Allow setState in useEffect for legitimate use cases (hydration, subscriptions)
      // This rule is overly strict and blocks common patterns
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
