module.exports = {
  devServer: {
    proxy: {
      '/api/proxy': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        pathRewrite: {
          '^/api/proxy': '/api/proxy'
        }
      }
    }
  }
} 