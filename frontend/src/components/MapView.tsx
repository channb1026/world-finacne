import { useCallback, useEffect, useState } from 'react'
import { MapContainer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { MapSpot } from '../data/mock'
import { MAP_SPOTS_DEFAULT } from '../data/mock'
import { fetchMapSpots, POLL_INTERVAL_NEWS } from '../services/api'
import 'leaflet/dist/leaflet.css'

/** 深色底图：Stadia Alidade Smooth Dark；仅请求合法瓦片坐标，避免 404 */
const DARK_TILE = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png'

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

function createSpotIcon(spot: MapSpot, selected: boolean) {
  const title = `${spot.name} · ${spot.count} 条情报（点击查看）`
  return L.divIcon({
    className: 'spot-marker',
    html: `<div class="spot-pulse ${selected ? 'selected' : ''}" title="${title}"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function SpotMarkers({
  spots,
  selectedId,
  onSpotClick,
}: {
  spots: MapSpot[]
  selectedId: string | null
  onSpotClick: (id: MapSpot['id']) => void
}) {
  return (
    <>
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={createSpotIcon(spot, selectedId === spot.id)}
          eventHandlers={{
            click: () => onSpotClick(spot.id),
          }}
        />
      ))}
    </>
  )
}

const DEFAULT_ZOOM = 3

function MapInit() {
  const map = useMap()
  useEffect(() => {
    map.setView([25, 20], DEFAULT_ZOOM)
  }, [map])
  return null
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

export function MapView({ selectedRegionId, onRegionSelect }: MapViewProps) {
  const [spots, setSpots] = useState<MapSpot[]>(MAP_SPOTS_DEFAULT)

  useEffect(() => {
    const load = () => fetchMapSpots().then(setSpots).catch(() => setSpots(MAP_SPOTS_DEFAULT))
    load()
    const t = setInterval(load, POLL_INTERVAL_NEWS)
    return () => clearInterval(t)
  }, [])

  const handleSpotClick = useCallback(
    (id: MapSpot['id']) => onRegionSelect(id),
    [onRegionSelect]
  )

  return (
    <div className="map-wrap">
      <MapContainer
        center={[25, 20]}
        zoom={DEFAULT_ZOOM}
        zoomControl={true}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
        maxBounds={L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180))}
        maxBoundsViscosity={1}
      >
        <BoundedTileLayerMount />
        <MapInit />
        <MapResizeSync />
        <SpotMarkers
          spots={spots}
          selectedId={selectedRegionId}
          onSpotClick={handleSpotClick}
        />
      </MapContainer>
    </div>
  )
}
