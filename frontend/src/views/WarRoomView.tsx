import { useState, useCallback, lazy, Suspense } from 'react'
import { FXPanel } from '../components/FXPanel'
import { CommoditiesPanel } from '../components/CommoditiesPanel'
import { NewsPanel } from '../components/NewsPanel'
import { StocksPanel } from '../components/StocksPanel'
import { ASharePanel } from '../components/ASharePanel'
import { KeyMetricsBar } from '../components/KeyMetricsBar'
import { TickerStrip } from '../components/TickerStrip'
import { MapSkeleton } from '../components/MapSkeleton'
import { BottomBar } from '../components/BottomBar'
import { SourceHealthPanel } from '../components/SourceHealthPanel'
import type { RegionId } from '../data/mock'

const SHOW_SOURCE_HEALTH_PANEL = import.meta.env.VITE_SHOW_SOURCE_HEALTH === 'true'

const MapView = lazy(() =>
  import('../components/MapView').then((m) => ({ default: m.MapView }))
)
const RegionDrawer = lazy(() =>
  import('../components/RegionDrawer').then((m) => ({ default: m.RegionDrawer }))
)

export function WarRoomView() {
  const [selectedRegion, setSelectedRegion] = useState<RegionId | null>(null)

  const handleRegionSelect = useCallback((id: RegionId) => {
    setSelectedRegion((prev) => (prev === id ? null : id))
  }, [])

  return (
    <div className="war-room">
      <div className="war-room__main">
        <aside className="war-room__left">
          <FXPanel />
          <CommoditiesPanel />
          <NewsPanel />
        </aside>
        <main className="war-room__center">
          <KeyMetricsBar />
          <Suspense fallback={<MapSkeleton />}>
            <MapView
              selectedRegionId={selectedRegion}
              onRegionSelect={handleRegionSelect}
            />
          </Suspense>
          <TickerStrip />
          {selectedRegion && (
            <Suspense fallback={null}>
              <RegionDrawer
                regionId={selectedRegion}
                onClose={() => setSelectedRegion(null)}
              />
            </Suspense>
          )}
        </main>
        <aside className="war-room__right">
          <StocksPanel />
          <ASharePanel />
          {SHOW_SOURCE_HEALTH_PANEL && <SourceHealthPanel />}
        </aside>
      </div>
      <BottomBar />
    </div>
  )
}
