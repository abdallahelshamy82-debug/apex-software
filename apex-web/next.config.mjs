/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/magixa.apk',
        destination: 'https://expo.dev/artifacts/eas/GIUJLT3oL1Uv_1xc3P-bEPqv0iyV-Gh1I6uAN8q7Eho.apk',
        permanent: false,
      },
      {
        source: '/app.apk',
        destination: 'https://expo.dev/artifacts/eas/GIUJLT3oL1Uv_1xc3P-bEPqv0iyV-Gh1I6uAN8q7Eho.apk',
        permanent: false,
      },
      {
        source: '/download',
        destination: 'https://expo.dev/artifacts/eas/GIUJLT3oL1Uv_1xc3P-bEPqv0iyV-Gh1I6uAN8q7Eho.apk',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

