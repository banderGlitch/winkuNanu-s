/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Determine the backend URL. Use the environment variable if it's set,
    // otherwise default to the IPv4 loopback address for local development.
    // const backendUrl = 'http://localhost:8080';
    // whenever you are running the backend in docker, use the following line
    // building an image of the backend and running it in docker, change the backendUrl to the following line


    const backendUrl = 'http://host.docker.internal:8080';

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: 'http://127.0.0.1:8080' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ]
      }
    ];
  }
};

module.exports = nextConfig; 