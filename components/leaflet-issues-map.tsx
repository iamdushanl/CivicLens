"use client"

import { useEffect } from "react"
import L, { type LatLngExpression } from "leaflet"
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet"
import type { Issue } from "@/lib/types"

interface LeafletIssuesMapProps {
  issues: Issue[]
  center: [number, number]
  userLocation: [number, number] | null
  onSelectIssue: (issueId: string) => void
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center)
  }, [center, map])

  return null
}

export function LeafletIssuesMap({ issues, center, userLocation, onSelectIssue }: LeafletIssuesMapProps) {
  useEffect(() => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    })
  }, [])

  const pinIssues = issues.filter(
    (issue) =>
      issue.coordinates &&
      typeof issue.coordinates.lat === "number" &&
      typeof issue.coordinates.lng === "number"
  )

  return (
    <MapContainer
      center={center as LatLngExpression}
      zoom={12}
      className="h-full w-full"
      scrollWheelZoom
      attributionControl
    >
      <RecenterMap center={center} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {pinIssues.map((issue) => (
        <Marker
          key={issue.id}
          position={[issue.coordinates!.lat, issue.coordinates!.lng] as LatLngExpression}
          eventHandlers={{
            click: () => onSelectIssue(issue.id),
          }}
        >
          <Popup>
            <div className="min-w-45">
              <p className="text-sm font-semibold">{issue.title}</p>
              <p className="text-xs text-muted-foreground">{issue.location}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {userLocation && (
        <Circle
          center={userLocation as LatLngExpression}
          radius={80}
          pathOptions={{ color: "#2563eb", fillColor: "#60a5fa", fillOpacity: 0.35 }}
        />
      )}
    </MapContainer>
  )
}
