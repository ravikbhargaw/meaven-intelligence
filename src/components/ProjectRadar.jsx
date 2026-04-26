import React from 'react'

const ProjectRadar = ({ projects = [] }) => {
    // 1. Calculate Dynamic Bounding Box
    let minLat, maxLat, minLng, maxLng

    const lats = projects.map(p => p.coordinates?.lat).filter(l => typeof l === 'number')
    const lngs = projects.map(p => p.coordinates?.lng).filter(l => typeof l === 'number')

    if (lats.length === 0 || lngs.length === 0) {
        // Fallback to South India view if no valid coordinates found
        minLat = 12; maxLat = 18; minLng = 73; maxLng = 79
    } else {
        minLat = Math.min(...lats); maxLat = Math.max(...lats)
        minLng = Math.min(...lngs); maxLng = Math.max(...lngs)

        // Ensure we have a minimum spread
        const latDiff = maxLat - minLat
        const lngDiff = maxLng - minLng
        
        const minSpread = 0.5
        if (latDiff < minSpread) { minLat -= minSpread/2; maxLat += minSpread/2 }
        if (lngDiff < minSpread) { minLng -= minSpread/2; maxLng += minSpread/2 }

        // Add Padding
        const currentLatDiff = maxLat - minLat
        const currentLngDiff = maxLng - minLng
        
        minLat -= currentLatDiff * 0.15; maxLat += currentLatDiff * 0.15
        minLng -= currentLngDiff * 0.15; maxLng += currentLngDiff * 0.15
    }

    const mapToSVG = (lat, lng) => {
        if (typeof lat !== 'number' || typeof lng !== 'number') return { x: '50%', y: '50%' }
        const x = ((lng - minLng) / (maxLng - minLng)) * 100
        const y = 100 - (((lat - minLat) / (maxLat - minLat)) * 100)
        return { x: `${x}%`, y: `${y}%` }
    }

    // Google Maps Light Palette
    const colors = {
        bg: '#f1f3f4',
        road: '#ffffff',
        water: '#c6e2ff',
        park: '#e8f5e9',
        border: '#dadce0',
        text: '#3c4043'
    }

    return (
        <div style={{ position: 'relative', width: '100%', height: '500px', background: colors.bg, borderRadius: '16px', border: `1px solid ${colors.border}`, overflow: 'hidden', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.05)' }}>
            
            {/* SIMULATED MAP GEOMETRY (SVG BACKGROUND) */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                {/* Simulated Water Bodies */}
                <path d="M0,400 Q150,380 300,450 L300,500 L0,500 Z" fill={colors.water} opacity="0.6" />
                <path d="M700,0 Q750,150 850,100 L1000,0 Z" fill={colors.water} opacity="0.6" />
                
                {/* Simulated Parks */}
                <rect x="10%" y="10%" width="15%" height="20%" rx="20" fill={colors.park} />
                <rect x="60%" y="40%" width="10%" height="15%" rx="15" fill={colors.park} />
                
                {/* Simulated Main Roads */}
                <path d="M0,250 L1000,250" stroke={colors.road} strokeWidth="15" fill="none" />
                <path d="M500,0 L500,500" stroke={colors.road} strokeWidth="15" fill="none" />
                <path d="M200,0 L800,500" stroke={colors.road} strokeWidth="8" fill="none" opacity="0.5" />
                
                {/* Road Outlines */}
                <path d="M0,250 L1000,250" stroke={colors.border} strokeWidth="1" fill="none" opacity="0.3" />
                <path d="M500,0 L500,500" stroke={colors.border} strokeWidth="1" fill="none" opacity="0.3" />
            </svg>

            {/* PROJECT PINS (GOOGLE STYLE) */}
            {projects.map(p => {
                const pos = mapToSVG(p.coordinates?.lat || 12.9, p.coordinates?.lng || 77.6)
                const pinColor = p.status === 'Completed' ? '#34a853' : (p.status === 'On Hold' ? '#ea4335' : '#4285f4')
                
                return (
                    <div key={p.id} style={{ position: 'absolute', left: pos.x, top: pos.y, transform: 'translate(-50%, -100%)', z_index: 10, cursor: 'pointer' }}>
                        {/* THE PIN DROPPER SHAPE */}
                        <div style={{ position: 'relative', width: '32px', height: '32px' }}>
                            <svg viewBox="0 0 24 24" style={{ width: '32px', height: '32px', filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.2))' }}>
                                <path fill={pinColor} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                        </div>
                        
                        {/* PIN LABEL (GOOGLE STYLE CARD) */}
                        <div className="pin-label-google" style={{ position: 'absolute', top: '-10px', left: '40px', background: '#fff', padding: '8px 12px', borderRadius: '4px', border: `1px solid ${colors.border}`, boxShadow: '0 2px 10px rgba(0,0,0,0.1)', whiteSpace: 'nowrap', z_index: 20 }}>
                            <p style={{ margin: 0, fontWeight: '700', color: colors.text, fontSize: '0.75rem' }}>{p.name}</p>
                            <p style={{ margin: '2px 0 0 0', color: '#70757a', fontSize: '0.65rem' }}>Site Ready: {p.readiness}% • {p.client}</p>
                            <div style={{ position: 'absolute', left: '-6px', top: '15px', width: '0', height: '0', borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: `6px solid ${colors.border}` }}></div>
                        </div>
                    </div>
                )
            })}

            {/* MAP OVERLAYS */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', background: '#fff', padding: '10px 15px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', border: `1px solid ${colors.border}` }}>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800', color: colors.text }}>Meaven GIS: Project Precision</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.65rem', color: '#70757a' }}>Viewing {projects.length} Tactical Sites</p>
            </div>

            <div style={{ position: 'absolute', bottom: '15px', right: '15px', background: '#fff', padding: '4px 8px', borderRadius: '2px', border: `1px solid ${colors.border}`, fontSize: '0.6rem', color: '#70757a' }}>
                Map data ©2026 Meaven Intelligence | Google-Style Precision Layer
            </div>
            
            <div style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ width: '28px', height: '28px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${colors.border}`, borderRadius: '2px 2px 0 0', cursor: 'pointer', fontWeight: 'bold', color: '#666' }}>+</div>
                <div style={{ width: '28px', height: '28px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${colors.border}`, borderRadius: '0 0 2px 2px', cursor: 'pointer', fontWeight: 'bold', color: '#666' }}>−</div>
            </div>
        </div>
    )
}

export default ProjectRadar
