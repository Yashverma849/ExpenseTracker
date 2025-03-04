/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['https://expensetracker-tau-liard.vercel.app/'], // Add your image domains here
    },
    async redirects() {
      return [
        {
          source: '/',
          destination: '/dashboard',
          permanent: true,
        },
      ];
    },
  };
  
  export default nextConfig;