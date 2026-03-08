import { useState, useCallback } from 'react'
import { FXPanel } from '../components/FXPanel'
import { CommoditiesPanel } from '../components/CommoditiesPanel'
import { NewsPanel } from '../components/NewsPanel'
import { StocksPanel } from '../components/StocksPanel'
import { ASharePanel } from '../components/ASharePanel'
import { KeyMetricsBar } from '../components/KeyMetricsBar'
import { TickerStrip } from '../components/TickerStrip'
import { MapView } from '../components/MapView'
import { RegionDrawer } from '../components/RegionDrawer'
import { BottomBar } from '../components/BottomBar'
import type { RegionId } from '../data/mock'

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
          <MapView
            selectedRegionId={selectedRegion}
            onRegionSelect={handleRegionSelect}
          />
          <TickerStrip />
          {selectedRegion && (
            <RegionDrawer
              regionId={selectedRegion}
              onClose={() => setSelectedRegion(null)}
            />
          )}
        </main>
        <aside className="war-room__right">
          <StocksPanel />
          <ASharePanel />
        </aside>
      </div>
      <BottomBar />
    </div>
  )
}
