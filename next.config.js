/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    },
  }
  
  console.log('Next.js Config - Environment Check:', {
    hasClientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  });
  
  module.exports = nextConfig