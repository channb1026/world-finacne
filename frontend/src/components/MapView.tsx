import { useCallback, useEffect, useMemo, useState, createContext, useContext } from 'react'
import { MapContainer, Marker, useMap } from 'react-leaflet'

const LAYER_SPOTS_KEY = 'map-layer-spots'

const MapLayerContext = createContext<{ showSpotsLayer: boolean; setShowSpotsLayer: (v: boolean) => void }>({
  showSpotsLayer: true,
  setShowSpotsLayer: () => {},
})
import L from 'leaflet'
import type { MapSpot } from '../data/mock'
import { MAP_SPOTS_DEFAULT } from '../data/mock'
import { fetchMapSpots, POLL_INTERVAL_NEWS } from '../services/api'
import { useLocale } from '../i18n/LocaleContext'
import { getRegionDisplayName } from '../i18n/displayNames'
import 'leaflet/dist/leaflet.css'

/** 深色底图：Stadia Alidade Smooth Dark；仅请求合法瓦片坐标，避免 404 */
const DARK_TILE = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png'

/** 区域预设：中心 [lat, lng]、缩放；label 由 i18n 按 id 取 map.preset.{id} */
const MAP_PRESETS = [
  { id: 'world', center: [25, 20] as [number, number], zoom: 3 },
  { id: 'americas', center: [20, -100] as [number, number], zoom: 3 },
  { id: 'europe', center: [52, 10] as [number, number], zoom: 4 },
  { id: 'asia', center: [25, 105] as [number, number], zoom: 4 },
  { id: 'china', center: [35, 105] as [number, number], zoom: 4 },
  { id: 'mena', center: [26, 45] as [number, number], zoom: 4 },
  { id: 'africa', center: [0, 22] as [number, number], zoom: 3 },
]

function getViewFromUrl(): { center: [number, number]; zoom: number } {
  const p = new URLSearchParams(window.location.search)
  const lat = parseFloat(p.get('lat') ?? '')
  const lng = parseFloat(p.get('lng') ?? '')
  const zoom = parseInt(p.get('zoom') ?? '', 10)
  return {
    center: Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : [25, 20],
    zoom: Number.isFinite(zoom) && zoom >= 1 && zoom <= 18 ? zoom : 3,
  }
}

function updateUrl(center: L.LatLng, zoom: number) {
  const params = new URLSearchParams(window.location.search)
  params.set('lat', center.lat.toFixed(4))
  params.set('lng', center.lng.toFixed(4))
  params.set('zoom', String(zoom))
  const q = params.toString()
  const url = q ? `${window.location.pathname}?${q}` : window.location.pathname
  window.history.replaceState(null, '', url)
  window.dispatchEvent(new CustomEvent('mapviewchange'))
}

/** 调用 Leaflet 原生 TileLayer.createTile(coords, done)，@types 声明为无参故用 any */
function callNativeCreateTile(
  layer: L.TileLayer,
  coords: { x: number; y: number; z: number },
  done: (err: Error | null, el?: HTMLElement) => void
): HTMLElement {
  const proto = L.TileLayer.prototype as unknown as Record<string, (c: unknown, d: unknown) => HTMLElement>
  return proto.createTile.call(layer, coords, done)
}

/** 仅对 0<=x,y<2^z 的瓦片发起请求，越界返回空瓦片，避免 400/404 */
const BoundedTileLayer = L.TileLayer.extend({
  createTile(coords: { x: number; y: number; z: number }, done: (err: Error | null, el?: HTMLElement) => void): HTMLElement {
    const max = 1 << coords.z
    if (coords.x < 0 || coords.x >= max || coords.y < 0 || coords.y >= max) {
      const tile = document.createElement('div')
      tile.className = 'leaflet-tile'
      done(null, tile)
      return tile
    }
    return callNativeCreateTile(this, coords, done)
  },
}) as new (url: string, options?: L.TileLayerOptions) => L.TileLayer

function createSpotIcon(spot: MapSpot, selected: boolean, spotHint: string, displayName: string) {
  const title = `${displayName} · ${spot.count}${spotHint}`
  return L.divIcon({
    className: 'spot-marker',
    html: `<div class="spot-pulse ${selected ? 'selected' : ''}" title="${title.replace(/"/g, '&quot;')}"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function SpotMarkers({
  spots,
  selectedId,
  onSpotClick,
  spotHint,
  getSpotDisplayName,
}: {
  spots: MapSpot[]
  selectedId: string | null
  onSpotClick: (id: MapSpot['id']) => void
  spotHint: string
  getSpotDisplayName: (spot: MapSpot) => string
}) {
  const { showSpotsLayer } = useContext(MapLayerContext)
  if (!showSpotsLayer) return null
  return (
    <>
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={createSpotIcon(spot, selectedId === spot.id, spotHint, getSpotDisplayName(spot))}
          eventHandlers={{
            click: () => onSpotClick(spot.id),
          }}
        />
      ))}
    </>
  )
}

/** 区域预设按钮条：置于地图上方，点击后 setView 并同步 URL */
function MapPresetsBar({ t }: { t: (key: string) => string }) {
  const map = useMap()
  return (
    <div className="map-presets-bar" role="group" aria-label={t('map.ariaPresets')}>
      {MAP_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className="map-presets-bar__btn"
          onClick={() => {
            map.setView(preset.center, preset.zoom)
            updateUrl(L.latLng(preset.center[0], preset.center[1]), preset.zoom)
          }}
        >
          {t(`map.preset.${preset.id}`)}
        </button>
      ))}
    </div>
  )
}

/** 地图移动/缩放结束时将视角写入 URL */
function MapUrlSync() {
  const map = useMap()
  useEffect(() => {
    const onMoveEnd = () => updateUrl(map.getCenter(), map.getZoom())
    map.on('moveend', onMoveEnd)
    return () => {
      map.off('moveend', onMoveEnd)
    }
  }, [map])
  return null
}

/** 图例与图层开关：说明当前图层含义，可勾选显示/隐藏新闻亮点 */
function MapLegend({ t }: { t: (key: string) => string }) {
  const { showSpotsLayer, setShowSpotsLayer } = useContext(MapLayerContext)
  return (
    <div className="map-legend" role="group" aria-label={t('map.ariaLegend')}>
      <span className="map-legend__dot" aria-hidden />
      <span className="map-legend__text">{t('map.legendSpots')}</span>
      <label className="map-legend__toggle">
        <input
          type="checkbox"
          checked={showSpotsLayer}
          onChange={(e) => setShowSpotsLayer(e.target.checked)}
          aria-label={t('map.ariaSpotsLayer')}
        />
        <span>{t('map.showSpots')}</span>
      </label>
    </div>
  )
}

/** 将 BoundedTileLayer 挂到地图上，避免越界瓦片请求 */
function BoundedTileLayerMount() {
  const map = useMap()
  useEffect(() => {
    const layer = new BoundedTileLayer(DARK_TILE, {
      noWrap: true,
      minZoom: 2,
      maxZoom: 18,
      maxNativeZoom: 18,
    })
    layer.addTo(map)
    return () => {
      map.removeLayer(layer)
    }
  }, [map])
  return null
}

/** 容器尺寸变化时通知 Leaflet 重算，保证地图填满 flex 区域 */
function MapResizeSync() {
  const map = useMap()
  useEffect(() => {
    const container = map.getContainer()
    const ro = new ResizeObserver(() => {
      setTimeout(() => map.invalidateSize(), 50)
    })
    ro.observe(container)
    setTimeout(() => map.invalidateSize(), 100)
    return () => ro.disconnect()
  }, [map])
  return null
}

interface MapViewProps {
  selectedRegionId: string | null
  onRegionSelect: (id: MapSpot['id']) => void
}

function getStoredShowSpotsLayer(): boolean {
  try {
    const v = localStorage.getItem(LAYER_SPOTS_KEY)
    return v !== 'false'
  } catch {
    return true
  }
}

export function MapView({ selectedRegionId, onRegionSelect }: MapViewProps) {
  const { t, locale } = useLocale()
  const [spots, setSpots] = useState<MapSpot[]>(MAP_SPOTS_DEFAULT)
  const [showSpotsLayer, setShowSpotsLayerState] = useState(getStoredShowSpotsLayer)
  const initialView = useMemo(() => getViewFromUrl(), [])

  const setShowSpotsLayer = useCallback((v: boolean) => {
    setShowSpotsLayerState(v)
    try {
      localStorage.setItem(LAYER_SPOTS_KEY, String(v))
    } catch {}
  }, [])

  useEffect(() => {
    const load = () => fetchMapSpots().then(setSpots).catch(() => setSpots(MAP_SPOTS_DEFAULT))
    load()
    const id = setInterval(load, POLL_INTERVAL_NEWS)
    return () => clearInterval(id)
  }, [])

  const handleSpotClick = useCallback(
    (id: MapSpot['id']) => onRegionSelect(id),
    [onRegionSelect]
  )

  const layerContextValue = useMemo(
    () => ({ showSpotsLayer, setShowSpotsLayer }),
    [showSpotsLayer, setShowSpotsLayer]
  )

  return (
    <div className="map-wrap">
      <MapLayerContext.Provider value={layerContextValue}>
      <MapContainer
        center={initialView.center}
        zoom={initialView.zoom}
        zoomControl={true}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
        maxBounds={L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180))}
        maxBoundsViscosity={1}
      >
        <BoundedTileLayerMount />
        <MapPresetsBar t={t} />
        <MapLegend t={t} />
        <MapUrlSync />
        <MapResizeSync />
        <SpotMarkers
          spots={spots}
          selectedId={selectedRegionId}
          onSpotClick={handleSpotClick}
          spotHint={t('map.spotHint')}
          getSpotDisplayName={(spot) => getRegionDisplayName(spot.id, locale, spot.name)}
        />
      </MapContainer>
      </MapLayerContext.Provider>
    </div>
  )
}
