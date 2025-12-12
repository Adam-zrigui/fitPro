// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'res.cloudinary.com',
      'images.unsplash.com',
      'img.youtube.com',
      'vumbnail.com',
      'i.ytimg.com',
      'i.vimeocdn.com'
    ],
  },
}

module.exports = nextConfig