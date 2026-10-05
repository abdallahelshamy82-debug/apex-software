/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/magixa.apk',
        destination: 'https://expo.dev/artifacts/eas/utgkWoRLYjbgPWKtCXzZ9Mc4EC76qMQKa3PxGC7Y47U.apk',
        permanent: false,
      },
      {
        source: '/app.apk',
        destination: 'https://expo.dev/artifacts/eas/utgkWoRLYjbgPWKtCXzZ9Mc4EC76qMQKa3PxGC7Y47U.apk',
        permanent: false,
      },
      {
        source: '/download',
        destination: 'https://expo.dev/artifacts/eas/utgkWoRLYjbgPWKtCXzZ9Mc4EC76qMQKa3PxGC7Y47U.apk',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

