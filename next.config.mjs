/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['https://finzarc-expensetracker.vercel.app/'], // Add your image domains here
    },
    // async redirects() {
    //   return [
    //     {
    //       source: '/',
    //       destination: '/dashboard',
    //       permanent: false,
    //     },
    //   ];
    // },
  };
  
  export default nextConfig;