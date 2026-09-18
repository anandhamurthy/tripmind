import { useTripStore } from './store/useTripStore'
import HomeScreen from './components/home/HomeScreen'
import AppShell from './components/layout/AppShell'

export default function App() {
  const activeTripId = useTripStore((s) => s.activeTripId)
  const hasActiveTrip = useTripStore((s) =>
    Boolean(activeTripId && s.trips.some((t) => t.id === activeTripId)),
  )

  return hasActiveTrip ? <AppShell /> : <HomeScreen />
}
