import { useState, useEffect, useMemo } from 'react'

const PRICING_DB = {
    glass: {
        '10mm Toughened': { rate: 150, brand: 'Saint Gobain' },
        '12mm Toughened': { rate: 180, brand: 'Saint Gobain' }
    },
    profiles: {
        modular_45: {
            side_top: { code: 'GPS 45M 01', rate: 1012, len: 2500 },
            bottom_set: { code: 'GPS 45GH 02+03', rate: 1138, len: 2500 },
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
        width: 3000,
        height: 2400,
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
        
        const widthVal = config.width || 0
        const heightVal = config.height || 0
        const widthM = widthVal / 1000
        const heightM = heightVal / 1000
        const areaSqft = (widthM * heightM) * 10.764
        
        const glassRate = PRICING_DB.glass[config.glassType].rate
        const glassCost = areaSqft * glassRate
        bom.push({ item: `Glass: ${config.glassType}`, qty: areaSqft.toFixed(2), unit: 'sqft', rate: glassRate, total: glassCost })
        landingCost += glassCost

        let totalLinearMetres = 0
        let totalBarsOrdered = 0

        if (config.systemType === 'partition') {
            const panes = Math.ceil(widthVal / 914) 
            const iSections = panes - 1
            const sideTopLen = (widthVal) + (heightVal * 2)
            const sideTopBars = Math.ceil(sideTopLen / PRICING_DB.profiles.modular_45.side_top.len)
            const bottomBars = Math.ceil(widthVal / PRICING_DB.profiles.modular_45.bottom_set.len)
            const iSectionBars = Math.ceil((iSections * heightVal) / PRICING_DB.profiles.modular_45.i_section.len)

            totalLinearMetres = (sideTopLen + widthVal + (iSections * heightVal)) / 1000
            totalBarsOrdered = sideTopBars + bottomBars + iSectionBars

            bom.push({ item: 'Side/Top Profile (GPS 45M 01)', qty: sideTopBars, unit: 'bars', rate: PRICING_DB.profiles.modular_45.side_top.rate, total: sideTopBars * PRICING_DB.profiles.modular_45.side_top.rate })
            bom.push({ item: 'Bottom Profile Set (GPS 45GH 02+03)', qty: bottomBars, unit: 'bars', rate: PRICING_DB.profiles.modular_45.bottom_set.rate, total: bottomBars * PRICING_DB.profiles.modular_45.bottom_set.rate })
            if (iSections > 0) bom.push({ item: `I-Section Divider (${iSections} nos)`, qty: iSectionBars, unit: 'bars', rate: PRICING_DB.profiles.modular_45.i_section.rate, total: iSectionBars * PRICING_DB.profiles.modular_45.i_section.rate })

            const perimeterM = (widthM * 2) + (heightM * 2)
            const gasketQty = perimeterM * 2
            const sealantQty = Math.max(1, Math.ceil(areaSqft * PRICING_DB.consumables.sealant.ratio))
            bom.push({ item: 'Gasket (Perimeter * 2)', qty: gasketQty.toFixed(2), unit: 'rm', rate: PRICING_DB.consumables.gasket.rate, total: gasketQty * PRICING_DB.consumables.gasket.rate })
            bom.push({ item: 'Sealant (4 per 500sqft)', qty: sealantQty, unit: 'bottles', rate: PRICING_DB.consumables.sealant.rate, total: sealantQty * PRICING_DB.consumables.sealant.rate })
            
            if (config.corners90 > 0) bom.push({ item: '90 Degree Connector', qty: config.corners90, unit: 'pcs', rate: PRICING_DB.hardware.connectors['90 Degree'], total: config.corners90 * PRICING_DB.hardware.connectors['90 Degree'] })
            if (config.corners180 > 0) bom.push({ item: '180 Degree Connector', qty: config.corners180, unit: 'pcs', rate: PRICING_DB.hardware.connectors['180 Degree'], total: config.corners180 * PRICING_DB.hardware.connectors['180 Degree'] })

            const laborCost = areaSqft * PRICING_DB.labor.partition
            bom.push({ item: 'Installation Labor', qty: areaSqft.toFixed(2), unit: 'sqft', rate: PRICING_DB.labor.partition, total: laborCost })
        }

        if (config.systemType === 'stile_door' || config.systemType === 'floor_spring') {
            const n = config.numDoors || 0
            const vascalQty = n === 0 ? 0 : (n === 1 ? 3 : Math.ceil(n * 2.5))
            
            if (config.systemType === 'stile_door') {
                const vertBars = Math.ceil((heightVal * 2 * n) / PRICING_DB.profiles.stile_door.vertical.len)
                const horizBottomBars = Math.ceil((widthVal * n) / PRICING_DB.profiles.stile_door.bottom.len)
                const horizCapBars = Math.ceil((widthVal * n) / PRICING_DB.profiles.stile_door.cap.len)
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
        const areaVol = config.totalProjectArea || 0
        if (config.isManualMargin) {
            margin = (config.manualMargin || 0) / 100
        } else {
            if (areaVol >= 2000) margin = 0.25
            else if (areaVol >= 500) margin = 0.40
        }
        
        const sellingPrice = landingCost / (1 - (margin >= 1 ? 0.99 : margin))
        const unitRate = config.systemType === 'partition' 
            ? sellingPrice / ((widthVal * heightVal) / 90000)
            : sellingPrice / (config.numDoors || 1)

        const vendorUnitRate = config.vendorQuote || 0
        const vQuote = config.systemType === 'partition'
            ? vendorUnitRate * ((widthVal * heightVal) / 90000)
            : vendorUnitRate * (config.numDoors || 1)
        
        const vendorProfit = vQuote - landingCost
        const vendorMarginPercent = vQuote > 0 ? (vendorProfit / vQuote) * 100 : 0
        const wastePercent = totalBarsOrdered > 0 ? (1 - (totalLinearMetres / (totalBarsOrdered * 2.5))) * 100 : 0

        const scripts = []
        if (vendorMarginPercent > 20) scripts.push(`Vendor markup is ${vendorMarginPercent.toFixed(1)}%. Target ₹${Math.round(landingCost * 1.15).toLocaleString()} (15% overhead).`)
        if (wastePercent > 30) scripts.push(`High wastage (${wastePercent.toFixed(1)}%). Demand off-cut credit for ${Math.round(totalBarsOrdered * 2.5 - totalLinearMetres)}m.`)
        if (config.systemType === 'stile_door') scripts.push(`BOM Audit: Essential hardware is ₹${(4300 * (config.numDoors || 0)).toLocaleString()} total. Check for 'Misc' padding.`)

        return { bom, landingCost, margin, sellingPrice, unitRate, vendorProfit, vendorMarginPercent, vendorUnitRate, wastePercent, scripts }
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
        <div className="pricing-engine animate-fade-in" style={{ padding: '0.5rem 0', color: 'var(--text-primary)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '1.5rem', alignItems: 'start', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '0.8rem', color: 'var(--accent-color)', letterSpacing: '0.1em' }}>01. SYSTEM SPECS</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>CONFIGURATION</label>
                                <select value={config.systemType} onChange={(e) => setConfig({...config, systemType: e.target.value})} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                                    <option value="partition" style={{ background: 'var(--bg-primary)' }}>Partition</option>
                                    <option value="stile_door" style={{ background: 'var(--bg-primary)' }}>Stile Door</option>
                                    <option value="floor_spring" style={{ background: 'var(--bg-primary)' }}>Floor Spring</option>
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>WIDTH (MM)</label>
                                    <input type="number" value={config.width || ''} onChange={(e) => setConfig({...config, width: e.target.value === '' ? '' : Number(e.target.value)})} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>HEIGHT (MM)</label>
                                    <input type="number" value={config.height || ''} onChange={(e) => setConfig({...config, height: e.target.value === '' ? '' : Number(e.target.value)})} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>GLASS TYPE</label>
                                <select value={config.glassType} onChange={(e) => setConfig({...config, glassType: e.target.value})} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                                    {Object.keys(PRICING_DB.glass).map(g => <option key={g} value={g} style={{ background: 'var(--bg-primary)' }}>{g}</option>)}
                                </select>
                            </div>
                            {config.systemType === 'stile_door' && (
                                <div>
                                    <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>HANDLE TYPE</label>
                                    <select value={config.handleType} onChange={(e) => setConfig({...config, handleType: e.target.value})} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                                        <option value="mortise" style={{ background: 'var(--bg-primary)' }}>Mortise Set</option>
                                        <option value="pull_2d" style={{ background: 'var(--bg-primary)' }}>2D Pull Set</option>
                                        <option value="h_handle" style={{ background: 'var(--bg-primary)' }}>H-Handle Black</option>
                                    </select>
                                </div>
                            )}
                            {(config.systemType === 'stile_door' || config.systemType === 'floor_spring') && (
                                <div>
                                    <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>NO. OF DOORS</label>
                                    <input type="number" value={config.numDoors || ''} onChange={(e) => setConfig({...config, numDoors: e.target.value === '' ? '' : Number(e.target.value)})} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)' }} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '0.8rem', color: 'var(--accent-color)', letterSpacing: '0.1em' }}>04. VENDOR AUDIT</h4>
                        <div>
                            <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                                VENDOR RATE ({config.systemType === 'partition' ? 'RS/SQFT' : 'PER UNIT'})
                            </label>
                            <input 
                                type="number" 
                                value={config.vendorQuote || ''} 
                                onChange={(e) => setConfig({...config, vendorQuote: e.target.value === '' ? '' : Number(e.target.value)})} 
                                placeholder={config.systemType === 'partition' ? "e.g. 450" : "e.g. 25000"}
                                style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '900' }} 
                            />
                            {config.vendorQuote > 0 && (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: calculation.vendorMarginPercent > 25 ? 'rgba(255, 69, 58, 0.1)' : 'rgba(50, 215, 75, 0.1)', borderRadius: '8px', border: `1px solid ${calculation.vendorMarginPercent > 25 ? 'var(--danger)' : 'var(--success)'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: '800' }}>VENDOR MARKUP:</span>
                                        <span style={{ fontSize: '1rem', fontWeight: '900', color: calculation.vendorMarginPercent > 25 ? 'var(--danger)' : 'var(--success)' }}>{calculation.vendorMarginPercent.toFixed(1)}%</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: '800' }}>V. TOTAL QUOTE:</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '800' }}>₹{Math.round(calculation.vendorProfit + calculation.landingCost).toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: '800' }}>V. PROFIT:</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--accent-color)' }}>
                                            ₹{Math.round(calculation.vendorProfit).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '0.8rem', color: 'var(--accent-color)', letterSpacing: '0.1em' }}>02. MARGIN LOGIC</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                            <input 
                                type="checkbox" 
                                checked={config.isManualMargin} 
                                onChange={(e) => setConfig({...config, isManualMargin: e.target.checked})} 
                                style={{ width: '16px', height: '16px' }}
                            />
                            <span style={{ fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.05em' }}>OVERRIDE TIERED MARGIN</span>
                        </div>
                        {config.isManualMargin ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>MANUAL MARGIN</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--accent-color)' }}>{config.manualMargin}%</span>
                                </div>
                                <input type="range" min="0" max="100" value={config.manualMargin || 0} onChange={(e) => setConfig({...config, manualMargin: Number(e.target.value)})} style={{ width: '100%', cursor: 'pointer' }} />
                            </div>
                        ) : (
                            <div>
                                <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>TOTAL PROJECT VOLUME (SQFT)</label>
                                <input type="number" value={config.totalProjectArea || ''} onChange={(e) => setConfig({...config, totalProjectArea: e.target.value === '' ? '' : Number(e.target.value)})} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)' }} />
                                <p style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>* Tiered Margin Applied: {(calculation.margin * 100).toFixed(0)}%</p>
                            </div>
                        )}
                    </div>

                    <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '0.8rem', color: 'var(--accent-color)', letterSpacing: '0.1em' }}>05. AI STRATEGIC INSIGHTS</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {calculation.scripts.map((script, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', padding: '0.8rem', background: 'var(--bg-accent)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                    <span style={{ fontSize: '1rem' }}>💡</span>
                                    <p style={{ margin: 0, fontSize: '0.75rem', lineHeight: '1.4', color: 'var(--text-primary)' }}>{script}</p>
                                </div>
                            ))}
                            {calculation.wastePercent > 0 && (
                                <div style={{ marginTop: '0.5rem', padding: '0.8rem', background: 'rgba(255, 149, 0, 0.05)', borderRadius: '6px', border: '1px solid #FF9500' }}>
                                    <p style={{ margin: 0, fontSize: '0.65rem', color: '#FF9500', fontWeight: '800' }}>WASTAGE ALERT: {calculation.wastePercent.toFixed(1)}%</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ background: 'var(--bg-accent)', border: '1px solid var(--accent-color)', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-color)' }} />
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                                {config.systemType === 'partition' ? 'Estimated Rate (Rs/Sqft)' : 'Estimated Price (Per Unit)'}
                            </p>
                            <h2 style={{ fontSize: '2.5rem', margin: '0.8rem 0', color: 'var(--accent-color)', fontWeight: '900' }}>
                                ₹{Math.round(calculation.unitRate).toLocaleString()}
                            </h2>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', borderTop: '1px solid rgba(102, 178, 194, 0.2)', paddingTop: '1rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', margin: 0 }}>TOTAL QUOTE</p>
                                    <p style={{ fontSize: '0.9rem', fontWeight: '800', margin: 0 }}>₹{Math.round(calculation.sellingPrice).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', margin: 0 }}>GP MARGIN</p>
                                    <p style={{ fontSize: '0.9rem', fontWeight: '800', margin: 0 }}>₹{Math.round(calculation.sellingPrice - calculation.landingCost).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto', padding: '1.5rem', background: 'rgba(102, 178, 194, 0.03)', borderRadius: '12px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Modeling engine active. Changes reflect instantly in the BOM breakdown below.
                        </p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '0.8rem', color: 'var(--accent-color)', letterSpacing: '0.1em' }}>03. BILL OF MATERIALS (BOM) BREAKDOWN</h4>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>ITEM DESCRIPTION</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>QTY</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>UNIT</th>
                                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>RATE (₹)</th>
                                <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>TOTAL (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calculation.bom.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '1rem', fontWeight: '600' }}>{item.item}</td>
                                    <td style={{ padding: '1rem' }}>{item.qty}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.unit}</td>
                                    <td style={{ padding: '1rem' }}>{item.rate.toLocaleString()}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '800' }}>{Math.round(item.total).toLocaleString()}</td>
                                </tr>
                            ))}
                            <tr style={{ background: 'rgba(102, 178, 194, 0.05)', fontWeight: '900' }}>
                                <td colSpan="4" style={{ padding: '1rem', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Landing Cost</td>
                                <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--accent-color)', fontSize: '1rem' }}>₹{Math.round(calculation.landingCost).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default StrategicPricingEngine
