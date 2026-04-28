import { useState, useEffect, useMemo } from 'react'

const PRICING_DB = {
    glass: {
        '10mm Toughened': { rate: 150, brand: 'Saint Gobain' },
        '12mm Toughened': { rate: 180, brand: 'Saint Gobain' }
    },
    profiles: {
        modular_45: {
            side_top: { code: 'GPS 45M 01', rate: 1012, len: 2500 },
            bottom_set: { code: 'GPS 45GH 02+03', rate: 1138, len: 2500 }, // Bundled 02+03
            i_section: { code: 'I-Section Divider', rate: 1000, len: 2500 }
        },
        stile_door: {
            vertical: { code: 'SD36-VP11', rate: 1624, len: 2500 },
            bottom: { code: 'SD36-HZ12B', rate: 1119, len: 1800 },
            cap: { code: 'SD36-RH13B', rate: 220, len: 1800 }
        }
    },
    hardware: {
        stile_door_essentials: [
            { name: 'Assembly Brackets', rate: 165, qty: 4 },
            { name: 'SS Hinges 4" Black', rate: 166, qty: 4 },
            { name: 'Saddle Plate Black', rate: 672, qty: 1 },
            { name: 'Gasket Set (Fixed)', rate: 1200, qty: 1 },
            { name: 'Pelmet Arm Closer Black', rate: 1445, qty: 1 }
        ],
        handles: {
            mortise: { name: 'Mortise Set (MH01+Lock+Cylinder)', rate: 1595 },
            pull_2d: { name: '2D Pull Set (Handle+Deadlock+Cyl+Cap)', rate: 2303 },
            h_handle: { name: 'H-Handle Black (Alucraft)', rate: 878 }
        },
        floor_spring_kit: [
            { name: 'Floor Spring Machine (Ozone)', rate: 2603.60 },
            { name: 'Top Patch', rate: 1006.02 },
            { name: 'Bottom Patch', rate: 1006.02 },
            { name: 'Pivot', rate: 184.00 },
            { name: 'OGH Handle', rate: 1120.10 }
        ],
        connectors: {
            '90 Degree': 1450,
            '180 Degree': 1200
        }
    },
    consumables: {
        sealant: { rate: 250, ratio: 4/500 }, 
        gasket: { rate: 25 } 
    },
    labor: {
        partition: 60,
        stile_door: 3000,
        floor_spring: 1200,
        frameless: 2500
    },
    vascal: { rate: 1735, code: 'GPS 45DF 04' },
    gst: 0.18
}

const StrategicPricingEngine = ({ projects = [], onAddNote }) => {
    const [selectedProjectId, setSelectedProjectId] = useState('')
    const [config, setConfig] = useState({
        width: 3000, // mm
        height: 2400, // mm
        glassType: '10mm Toughened',
        systemType: 'partition',
        handleType: 'mortise',
        totalProjectArea: 100,
        numDoors: 1,
        corners90: 0,
        corners180: 0,
        isManualMargin: false,
        manualMargin: 55,
        isAuditMode: false,
        vendorQuote: 0
    })

    const calculation = useMemo(() => {
        let bom = []
        let landingCost = 0
        
        const widthM = config.width / 1000
        const heightM = config.height / 1000
        const areaSqft = (widthM * heightM) * 10.764
        
        // 1. GLASS CALC
        const glassRate = PRICING_DB.glass[config.glassType].rate
        const glassCost = areaSqft * glassRate
        bom.push({ item: `Glass: ${config.glassType}`, qty: areaSqft.toFixed(2), unit: 'sqft', rate: glassRate, total: glassCost })
        landingCost += glassCost

        // 2. SYSTEM LOGIC
        let totalLinearMetres = 0
        let totalBarsOrdered = 0

        if (config.systemType === 'partition') {
            const panes = Math.ceil(config.width / 914) 
            const iSections = panes - 1
            const sideTopLen = (config.width) + (config.height * 2)
            const sideTopBars = Math.ceil(sideTopLen / PRICING_DB.profiles.modular_45.side_top.len)
            const bottomBars = Math.ceil(config.width / PRICING_DB.profiles.modular_45.bottom_set.len)
            const iSectionBars = Math.ceil((iSections * config.height) / PRICING_DB.profiles.modular_45.i_section.len)

            totalLinearMetres = (sideTopLen + config.width + (iSections * config.height)) / 1000
            totalBarsOrdered = sideTopBars + bottomBars + iSectionBars

            bom.push({ item: 'Side/Top Profile (GPS 45M 01)', qty: sideTopBars, unit: 'bars', rate: PRICING_DB.profiles.modular_45.side_top.rate, total: sideTopBars * PRICING_DB.profiles.modular_45.side_top.rate })
            bom.push({ item: 'Bottom Profile Set (GPS 45GH 02+03)', qty: bottomBars, unit: 'bars', rate: PRICING_DB.profiles.modular_45.bottom_set.rate, total: bottomBars * PRICING_DB.profiles.modular_45.bottom_set.rate })
            if (iSections > 0) bom.push({ item: `I-Section Divider (${iSections} nos)`, qty: iSectionBars, unit: 'bars', rate: PRICING_DB.profiles.modular_45.i_section.rate, total: iSectionBars * PRICING_DB.profiles.modular_45.i_section.rate })

            const perimeterM = (widthM * 2) + (heightM * 2)
            const gasketQty = perimeterM * 2
            const sealantQty = Math.max(1, Math.ceil(areaSqft * PRICING_DB.consumables.sealant.ratio))
            bom.push({ item: 'Gasket (Perimeter * 2)', qty: gasketQty.toFixed(2), unit: 'rm', rate: PRICING_DB.consumables.gasket.rate, total: gasketQty * PRICING_DB.consumables.gasket.rate })
            bom.push({ item: 'Sealant (4 per 500sqft)', qty: sealantQty, unit: 'bottles', rate: PRICING_DB.consumables.sealant.rate, total: sealantQty * PRICING_DB.consumables.sealant.rate })
            
            if (config.corners90 > 0) bom.push({ item: '90° Connector', qty: config.corners90, unit: 'pcs', rate: PRICING_DB.hardware.connectors['90 Degree'], total: config.corners90 * PRICING_DB.hardware.connectors['90 Degree'] })
            if (config.corners180 > 0) bom.push({ item: '180° Connector', qty: config.corners180, unit: 'pcs', rate: PRICING_DB.hardware.connectors['180 Degree'], total: config.corners180 * PRICING_DB.hardware.connectors['180 Degree'] })

            const laborCost = areaSqft * PRICING_DB.labor.partition
            bom.push({ item: 'Installation Labor', qty: areaSqft.toFixed(2), unit: 'sqft', rate: PRICING_DB.labor.partition, total: laborCost })
        }

        if (config.systemType === 'stile_door' || config.systemType === 'floor_spring') {
            const n = config.numDoors
            const vascalQty = n === 1 ? 3 : Math.ceil(n * 2.5)
            
            if (config.systemType === 'stile_door') {
                const vertBars = Math.ceil((config.height * 2 * n) / PRICING_DB.profiles.stile_door.vertical.len)
                const horizBottomBars = Math.ceil((config.width * n) / PRICING_DB.profiles.stile_door.bottom.len)
                const horizCapBars = Math.ceil((config.width * n) / PRICING_DB.profiles.stile_door.cap.len)
                totalBarsOrdered = vertBars + horizBottomBars + horizCapBars

                bom.push({ item: 'SD-VP11 Vertical', qty: vertBars, unit: 'bars', rate: PRICING_DB.profiles.stile_door.vertical.rate, total: vertBars * PRICING_DB.profiles.stile_door.vertical.rate })
                bom.push({ item: 'SD-HZ12B Bottom', qty: horizBottomBars, unit: 'bars', rate: PRICING_DB.profiles.stile_door.bottom.rate, total: horizBottomBars * PRICING_DB.profiles.stile_door.bottom.rate })
                bom.push({ item: 'SD-RH13B Cap', qty: horizCapBars, unit: 'bars', rate: PRICING_DB.profiles.stile_door.cap.rate, total: horizCapBars * PRICING_DB.profiles.stile_door.cap.rate })
                
                PRICING_DB.hardware.stile_door_essentials.forEach(h => {
                    bom.push({ item: h.name, qty: h.qty * n, unit: 'pcs', rate: h.rate, total: h.rate * h.qty * n })
                })
                const handle = PRICING_DB.hardware.handles[config.handleType]
                bom.push({ item: handle.name, qty: n, unit: 'set', rate: handle.rate, total: handle.rate * n })
                bom.push({ item: 'Stile Door Labor', qty: n, unit: 'units', rate: PRICING_DB.labor.stile_door, total: PRICING_DB.labor.stile_door * n })
            } else {
                PRICING_DB.hardware.floor_spring_kit.forEach(h => {
                    bom.push({ item: h.name, qty: n, unit: 'pcs', rate: h.rate, total: h.rate * n })
                })
                bom.push({ item: 'Floor Spring Labor', qty: n, unit: 'units', rate: PRICING_DB.labor.floor_spring, total: PRICING_DB.labor.floor_spring * n })
            }
            bom.push({ item: `Vascal Opt. (N=${n})`, qty: vascalQty, unit: 'units', rate: PRICING_DB.vascal.rate, total: PRICING_DB.vascal.rate * vascalQty })
        }

        landingCost = bom.reduce((acc, curr) => acc + curr.total, 0)

        let margin = 0.55
        if (config.isManualMargin) {
            margin = config.manualMargin / 100
        } else {
            if (config.totalProjectArea >= 2000) margin = 0.25
            else if (config.totalProjectArea >= 500) margin = 0.40
        }
        
        const sellingPrice = landingCost / (1 - margin)
        const vendorProfit = config.vendorQuote - landingCost
        const vendorMarginPercent = config.vendorQuote > 0 ? (vendorProfit / config.vendorQuote) * 100 : 0
        const wastePercent = totalBarsOrdered > 0 ? (1 - (totalLinearMetres / (totalBarsOrdered * 2.5))) * 100 : 0

        const scripts = []
        if (vendorMarginPercent > 20) scripts.push(`Vendor markup is ${vendorMarginPercent.toFixed(1)}%. Target ₹${Math.round(landingCost * 1.15).toLocaleString()} (15% overhead).`)
        if (wastePercent > 30) scripts.push(`High wastage (${wastePercent.toFixed(1)}%). Demand off-cut credit for ${Math.round(totalBarsOrdered * 2.5 - totalLinearMetres)}m.`)
        if (config.systemType === 'stile_door') scripts.push(`BOM Audit: Essential hardware is ₹${(4300 * config.numDoors).toLocaleString()} total. Check for 'Misc' padding.`)

        return { bom, landingCost, margin, sellingPrice, vendorProfit, vendorMarginPercent, wastePercent, scripts }
    }, [config])

    const handlePushToTimeline = () => {
        if (!selectedProjectId) return
        const logContent = `STRATEGIC PRICING (Excl. GST):
System: ${config.systemType.toUpperCase()}
Landing Cost: ₹${calculation.landingCost.toLocaleString()}
Selling Price: ₹${calculation.sellingPrice.toLocaleString()}
Margin: ${(calculation.margin * 100).toFixed(0)}% ${config.isManualMargin ? '(MANUAL)' : '(TIERED)'}`
        onAddNote(selectedProjectId, logContent)
        alert('Strategic quote logged (Exclusive of GST).')
    }

    return (
        <div className="pricing-engine animate-fade-in" style={{ padding: '0.5rem 0', color: '#fff' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '1.5rem', alignItems: 'start' }}>
                
                {/* COLUMN 1: ARCHITECTURE & SPECS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '0.8rem', color: 'var(--accent-color)', letterSpacing: '0.1em' }}>01. SYSTEM SPECS</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>CONFIGURATION</label>
                                <select value={config.systemType} onChange={(e) => setConfig({...config, systemType: e.target.value})} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}>
                                    <option value="partition">Partition</option>
                                    <option value="stile_door">Stile Door</option>
                                    <option value="floor_spring">Floor Spring</option>
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>WIDTH (MM)</label>
                                    <input type="number" value={config.width} onChange={(e) => setConfig({...config, width: Number(e.target.value)})} style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>HEIGHT (MM)</label>
                                    <input type="number" value={config.height} onChange={(e) => setConfig({...config, height: Number(e.target.value)})} style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>GLASS TYPE</label>
                                <select value={config.glassType} onChange={(e) => setConfig({...config, glassType: e.target.value})} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}>
                                    {Object.keys(PRICING_DB.glass).map(g => <option key={g} value={g}>{g}</option>)}
                                    <option value="annealed" disabled>Annealed Glass (BLACKOUT)</option>
                                </select>
                            </div>
                            {(config.systemType === 'stile_door' || config.systemType === 'floor_spring') && (
                                <div>
                                    <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>DOOR COUNT</label>
                                    <input type="number" value={config.numDoors} onChange={(e) => setConfig({...config, numDoors: Number(e.target.value)})} style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff' }} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '0.8rem', color: 'var(--accent-color)', letterSpacing: '0.1em' }}>02. HARDWARE LOOP</h4>
                        {config.systemType === 'stile_door' ? (
                            <select value={config.handleType} onChange={(e) => setConfig({...config, handleType: e.target.value})} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}>
                                <option value="mortise">Mortise Set</option>
                                <option value="pull_2d">2D Pull Set</option>
                                <option value="h_handle">H-Handle</option>
                            </select>
                        ) : config.systemType === 'partition' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>90° CORNERS</label>
                                    <input type="number" value={config.corners90} onChange={(e) => setConfig({...config, corners90: Number(e.target.value)})} style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>180° JOINTS</label>
                                    <input type="number" value={config.corners180} onChange={(e) => setConfig({...config, corners180: Number(e.target.value)})} style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff' }} />
                                </div>
                            </div>
                        ) : (
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Ozone Kit: Machine + Patches + Pivot</p>
                        )}
                    </div>
                </div>

                {/* COLUMN 2: STRATEGIC TIERING & AUDIT */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: 0, fontSize: '0.8rem', color: 'var(--accent-color)', letterSpacing: '0.1em' }}>03. MARGIN LOGIC</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <input type="checkbox" checked={config.isManualMargin} onChange={(e) => setConfig({...config, isManualMargin: e.target.checked})} />
                                <span style={{ fontSize: '0.6rem', fontWeight: '800' }}>MANUAL</span>
                            </div>
                        </div>
                        {!config.isManualMargin ? (
                            <div>
                                <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>PROJECT SCALE (SQFT)</label>
                                <input type="number" value={config.totalProjectArea} onChange={(e) => setConfig({...config, totalProjectArea: Number(e.target.value)})} style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff' }} />
                                <div style={{ marginTop: '0.8rem', fontSize: '0.7rem', fontWeight: '800', color: 'var(--accent-color)' }}>
                                    TIER: {config.totalProjectArea >= 2000 ? 'SCALE (25%)' : config.totalProjectArea >= 500 ? 'GROWTH (40%)' : 'STANDARD (55%)'}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>CUSTOM MARGIN: {config.manualMargin}%</label>
                                <input type="range" min="10" max="80" value={config.manualMargin} onChange={(e) => setConfig({...config, manualMargin: Number(e.target.value)})} style={{ width: '100%', marginTop: '0.5rem' }} />
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ background: config.isAuditMode ? 'rgba(255, 69, 58, 0.03)' : 'rgba(255,255,255,0.02)', border: config.isAuditMode ? '1px solid var(--danger)' : '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: 0, fontSize: '0.8rem', color: config.isAuditMode ? 'var(--danger)' : 'var(--text-secondary)', letterSpacing: '0.1em' }}>04. VENDOR AUDIT</h4>
                            <button onClick={() => setConfig({...config, isAuditMode: !config.isAuditMode})} style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', border: 'none', background: config.isAuditMode ? 'var(--danger)' : 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.6rem', fontWeight: '800', cursor: 'pointer' }}>
                                {config.isAuditMode ? 'ACTIVE' : 'OFF'}
                            </button>
                        </div>
                        {config.isAuditMode && (
                            <div>
                                <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>VENDOR QUOTE (EXCL. GST)</label>
                                <input type="number" value={config.vendorQuote} onChange={(e) => setConfig({...config, vendorQuote: Number(e.target.value)})} style={{ width: '100%', padding: '0.6rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--danger)', borderRadius: '6px', color: '#fff', textAlign: 'center', fontSize: '1rem', fontWeight: '800' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', margin: 0 }}>MARKUP</p>
                                        <p style={{ fontSize: '0.9rem', fontWeight: '800', margin: 0, color: calculation.vendorMarginPercent > 20 ? 'var(--danger)' : 'var(--success)' }}>{calculation.vendorMarginPercent.toFixed(1)}%</p>
                                    </div>
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', margin: 0 }}>WASTE</p>
                                        <p style={{ fontSize: '0.9rem', fontWeight: '800', margin: 0 }}>{calculation.wastePercent.toFixed(0)}%</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMN 3: REAL-TIME RESULTS & BOM */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ background: 'var(--bg-accent)', border: '1px solid var(--accent-color)', padding: '1.5rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', letterSpacing: '0.2em' }}>{config.isAuditMode ? 'VENDOR BASELINE' : 'QUOTED PRICE (EXCL. GST)'}</p>
                            <h2 style={{ fontSize: '2.5rem', margin: '0.8rem 0', color: 'var(--accent-color)' }}>₹{Math.round(config.isAuditMode ? calculation.landingCost : calculation.sellingPrice).toLocaleString()}</h2>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                <div style={{ fontSize: '0.7rem' }}><span style={{ color: 'var(--text-secondary)' }}>LC:</span> ₹{Math.round(calculation.landingCost).toLocaleString()}</div>
                                <div style={{ fontSize: '0.7rem' }}><span style={{ color: 'var(--text-secondary)' }}>MARGIN:</span> {(calculation.margin * 100).toFixed(0)}%</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1.2rem', maxHeight: '380px', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                            <h4 style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>BOM BREAKDOWN</h4>
                            <button onClick={handlePushToTimeline} style={{ background: 'none', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.6rem', cursor: 'pointer' }}>LOG QUOTE</button>
                        </div>
                        <table style={{ width: '100%', fontSize: '0.7rem', borderCollapse: 'collapse' }}>
                            <tbody>
                                {calculation.bom.map((line, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <td style={{ padding: '0.5rem 0' }}>{line.item}</td>
                                        <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>{line.qty} {line.unit}</td>
                                        <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: '700' }}>₹{Math.round(line.total).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {config.isAuditMode && calculation.scripts.length > 0 && (
                            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255, 69, 58, 0.05)', borderRadius: '6px', border: '1px solid var(--danger)' }}>
                                <p style={{ fontSize: '0.6rem', color: 'var(--danger)', fontWeight: '800', margin: '0 0 0.5rem 0' }}>NEGOTIATION LEVERS</p>
                                {calculation.scripts.map((s, i) => <p key={i} style={{ fontSize: '0.65rem', margin: '0 0 0.3rem 0', lineHeight: '1.4' }}>• {s}</p>)}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}

export default StrategicPricingEngine
