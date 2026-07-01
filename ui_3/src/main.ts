import './style.css'
import { AssistantApp } from './app'

const root = document.querySelector<HTMLElement>('#app')

if (!root) {
  throw new Error('Application root is missing')
}

new AssistantApp(root).start()
