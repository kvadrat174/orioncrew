import App from './App'

const app = App.create().catch(e => {
  console.error('\nApp.create() error:\n', e)
  process.exit(1)
})