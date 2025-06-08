import App from './App'
require('dotenv').config()

const app = App.create().catch(e => {
  console.error('\nApp.create() error:\n', e)
  process.exit(1)
})