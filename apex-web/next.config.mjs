/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/magixa.apk',
        destination: 'https://expo.dev/artifacts/eas/1xCAi-BNU8ind3x8rETmRd6TkD2RQdkoW-_3HbhG_Ew.apk',
        permanent: false,
      },
      {
        source: '/app.apk',
        destination: 'https://expo.dev/artifacts/eas/1xCAi-BNU8ind3x8rETmRd6TkD2RQdkoW-_3HbhG_Ew.apk',
        permanent: false,
      },
      {
        source: '/download',
        destination: 'https://expo.dev/artifacts/eas/1xCAi-BNU8ind3x8rETmRd6TkD2RQdkoW-_3HbhG_Ew.apk',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

