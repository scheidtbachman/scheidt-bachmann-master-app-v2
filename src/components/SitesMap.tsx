'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import Link from 'next/link'
import 'leaflet/dist/leaflet.css'

type Site = {
  id: string
  name: string
  site_code: string | null
  customer_name: string | null
  gps_lat: number | null
  gps_lng: number | null
  status: string
}

// Fix default marker icon paths (Leaflet bug in bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Auto-fit bounds to show all sites
function FitBounds({ sites }: { sites: Site[] }) {
  const map = useMap()
  useEffect(() => {
    if (sites.length > 1) {
      const bounds = L.latLngBounds(
        sites.map((s) => [s.gps_lat as number, s.gps_lng as number])
      )
      map.fitBounds(bounds, { padding: [40, 40] })
    } else if (sites.length === 1) {
      map.setView([sites[0].gps_lat as number, sites[0].gps_lng as number], 14)
    }
  }, [sites, map])
  return null
}

export default function SitesMap({ sites }: { sites: Site[] }) {
  // Filter out sites without coordinates
  const mapSites = sites.filter((s) => s.gps_lat != null && s.gps_lng != null)

  if (!mapSites.length) {
    return (
      <div className="bg-white border rounded-lg p-12 text-center">
        <div className="text-slate-400 mb-3 text-4xl">🗺️</div>
        <p className="text-slate-500 mb-2">No sites with GPS coordinates</p>
        <p className="text-xs text-slate-400">
          Edit a site and add its latitude and longitude to see it on the map.
        </p>
      </div>
    )
  }

  const center: [number, number] = [mapSites[0].gps_lat as number, mapSites[0].gps_lng as number]

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="h-[600px] w-full">
        <MapContainer
          center={center}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds sites={mapSites} />
          {mapSites.map((s) => (
            <Marker key={s.id} position={[s.gps_lat as number, s.gps_lng as number]}>
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-slate-500">{s.site_code}</div>
                  {s.customer_name && (
                    <div className="text-xs text-slate-600 mt-1">{s.customer_name}</div>
                  )}
                  <Link
                    href={`/sites/${s.id}`}
                    className="text-blue-600 text-xs mt-2 inline-block hover:underline"
                  >
                    View details →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <div className="p-3 border-t text-xs text-slate-500 bg-slate-50 flex items-center justify-between">
        <span>{mapSites.length} site{mapSites.length !== 1 ? 's' : ''} shown on map</span>
        <span>Click a marker to see details</span>
      </div>
    </div>
  )
}