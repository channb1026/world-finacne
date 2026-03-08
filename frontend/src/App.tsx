import { LocaleProvider } from './i18n/LocaleContext'
import { WarRoomView } from './views/WarRoomView'
import './App.css'

function App() {
  return (
    <LocaleProvider>
      <WarRoomView />
    </LocaleProvider>
  )
}

export default App
