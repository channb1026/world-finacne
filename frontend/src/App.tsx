import { LocaleProvider } from './i18n/LocaleContext'
import { DataProvider } from './state/DataContext'
import { WarRoomView } from './views/WarRoomView'
import './App.css'

function App() {
  return (
    <LocaleProvider>
      <DataProvider>
        <WarRoomView />
      </DataProvider>
    </LocaleProvider>
  )
}

export default App
