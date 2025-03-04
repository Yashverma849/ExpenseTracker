// filepath: /c:/Users/verma/expensetracker/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
      return [
        {
          source: '/',
          destination: '/dashboard',
          permanent: false,
          has: [
            {
              type: 'cookie',
              key: 'supabase-auth-token',
            },
          ],
        },
      ];
    },
  };
  
  export default nextConfig;