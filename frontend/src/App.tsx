import { AppErrorBoundary } from './components/AppErrorBoundary'
import { LocaleProvider } from './i18n/LocaleContext'
import { DataProvider } from './state/DataContext'
import { WarRoomView } from './views/WarRoomView'
import './App.css'

function App() {
  return (
    <AppErrorBoundary>
      <LocaleProvider>
        <DataProvider>
          <WarRoomView />
        </DataProvider>
      </LocaleProvider>
    </AppErrorBoundary>
  )
}

export default App
