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
      {
        source: '/whatsapp',
        destination: 'https://wa.me/201285512241?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20Apex%20Software%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%AE%D8%AF%D9%85%D8%A7%D8%AA%D9%83%D9%85%20%D8%A7%D9%84%D8%A8%D8%B1%D9%85%D8%AC%D9%8A%D8%A9',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

