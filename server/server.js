import { createApp } from './app.js'
import { assertServerConfiguration, config } from './config.js'

assertServerConfiguration()
createApp().listen(config.port, () => {
  console.log(`UnoMotors API listening on http://localhost:${config.port}`)
})
