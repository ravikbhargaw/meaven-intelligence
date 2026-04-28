import React, { useState, useEffect } from 'react'

const SiteReadiness = ({ project, projects, portfolios = [], template = [], data, onUpdate, onUpdateMilestones, onProposePlaybookUpdate, userRole, isReadOnly, onBack, onLockLocation, onUpdateProject, onSelectProject }) => {
  const [items, setItems] = useState(data?.items || template || [])
  const [photos, setPhotos] = useState(data?.photos || [])
  const [observations, setObservations] = useState(data?.observations || '')
  const [isEditingDates, setIsEditingDates] = useState(false)
  const [isEditingChecklist, setIsEditingChecklist] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false)
  const [locationVerified, setLocationVerified] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)

  const defaultTemplate = [
    { id: 1, label: 'Physical Site Measurement & Verification', status: 'pending', category: 'Civil', notes: '' },
    { id: 2, label: 'Electrical Point Mapping (As-per-Site)', status: 'pending', category: 'MEP', notes: '' },
    { id: 3, label: 'Wall Finish & Plastering Check', status: 'pending', category: 'Civil', notes: '' },
    { id: 4, label: 'Plumbing Core Cutting & Slope Check', status: 'pending', category: 'MEP', notes: '' },
    { id: 5, label: 'Flooring Leveling & Readiness', status: 'pending', category: 'Finishes', notes: '' }
  ]

  // SYNC WITH GLOBAL PLAYBOOK
  useEffect(() => {
    if (data && data.items) {
        setItems(Array.isArray(data.items) ? data.items : [])
        setPhotos(Array.isArray(data.photos) ? data.photos : [])
        setObservations(data.observations || '')
    } else {
        setItems(defaultTemplate)
        setPhotos([])
        setObservations('')
    }
  }, [project?.id, data])

  // MANUAL SYNC HANDLER (TO PREVENT LOOPS)
  const syncToParent = (newItems, newPhotos, newObs) => {
      if (!onUpdate) return
      onUpdate({ 
          items: newItems || items, 
          photos: newPhotos || photos, 
          observations: newObs || observations 
      })
  }

  const toggleStatus = (id) => {
    if (isReadOnly || !isEditingChecklist) return
    const newItems = items.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'pending' ? 'passed' : (item.status === 'passed' ? 'failed' : 'pending')
        return { ...item, status: nextStatus }
      }
      return item
    })
    setItems(newItems)
    syncToParent(newItems, null, null)
  }

  const handleNoteChange = (id, val) => {
    if (isReadOnly || !isEditingChecklist) return
    const newItems = items.map(item => item.id === id ? { ...item, notes: val } : item)
    setItems(newItems)
    syncToParent(newItems, null, null)
  }

  const handlePhotoUpload = (e) => {
    if (isReadOnly) return
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
          const newPhotos = [...photos, reader.result]
          setPhotos(newPhotos)
          syncToParent(null, newPhotos, null)
      }
      reader.readAsDataURL(file)
    }
  }

  // RENDER AUDIT BENCH IF NO ACTIVE PROJECT OR INITIALIZING
  if (!project || project.id === 0) {
    return (
      <div className="audit-bench-view animate-fade-in" style={{ padding: '1rem' }}>
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '900', margin: 0 }}>Project Audit Bench</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Deploy technical audit playbooks to newly initialized project loops.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
          {(projects || []).map(p => (
            <div key={p.id} className="card cinematic-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.65rem', background: 'rgba(102, 178, 194, 0.1)', color: 'var(--accent-color)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: '800' }}>#{p.id}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '800', color: p.readiness > 0 ? 'var(--success)' : 'var(--text-secondary)' }}>{p.readiness > 0 ? 'DEPLOYED' : 'PENDING'}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{p.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>{p.client}</p>
              </div>
              
              <button 
                onClick={() => onSelectProject(p.id)}
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '2rem', justifyContent: 'center' }}
              >
                {p.readiness > 0 ? 'Open Audit Hub →' : 'Deploy Audit Playbook 🚀'}
              </button>
            </div>
          ))}
          {(projects || []).length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '20px', border: '1px dashed var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No project loops initialized yet. Use the sidebar to start a new project.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const siteReadiness = project?.readiness || 0
  const financials = project?.clientFinancials || { totalValue: 0, requests: [], received: [] }
  const totalReceived = (financials.received || []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  const outstanding = (Number(financials.totalValue) || 0) - totalReceived

  return (
    <div className="site-readiness-module animate-fade-in" style={{ padding: '0 1rem', display: 'block', minHeight: '100px' }}>
      {/* Header & Main Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <button 
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', marginBottom: '1rem', fontWeight: '800', display: 'block', padding: 0 }}
          >
            ← RETURN TO COMMAND
          </button>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '900', margin: 0, letterSpacing: '-0.04em' }}>{project?.name}</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.75rem' }}>Tactical Execution Hub | Site ID: #{project?.id}</p>
        </div>
      </div>

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.65rem', background: 'var(--accent-color)', color: '#000', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '800' }}>AI TRACKED</div>
              <h3>Technical Readiness</h3>
              <div style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--accent-color)' }}>{project?.readiness || 0}%</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Tactical Audit Progress</p>
          </div>
          
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(102, 178, 194, 0.05) 0%, transparent 100%)', border: '1px solid var(--accent-color)' }}>
              <h4 style={{ margin: 0, fontSize: '0.75rem', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.2rem' }}>🤖 AI Site Intelligence</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Predictive Completion</span>
                      <span style={{ fontWeight: '700' }}>{project?.readiness > 80 ? 'Within 3 Days' : '14+ Days (Est.)'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Bottleneck Risk</span>
                      <span style={{ color: (items.filter(i => i.status === 'failed').length > 0) ? 'var(--danger)' : 'var(--success)', fontWeight: '700' }}>
                          {(items.filter(i => i.status === 'failed').length > 0) ? 'HIGH' : 'LOW'}
                      </span>
                  </div>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.4' }}>
                      "AI suggests prioritizing <b>Opening Dimensions</b> verification to avoid structural rework."
                  </p>
              </div>
          </div>

          <div className="card">
              <h3>Financial Pulse</h3>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>₹{(outstanding / 100000).toFixed(2)}L Outstanding</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>From ₹{(financials.totalValue / 100000).toFixed(2)}L Total Value</p>
          </div>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Site Checklist</h3>
              <button className="btn btn-outline" onClick={() => setIsEditingChecklist(!isEditingChecklist)}>
                  {isEditingChecklist ? 'Lock Checklist 🔒' : 'Edit Checklist 🔓'}
              </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(items || []).map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1.2rem', padding: '1.2rem', background: 'var(--bg-accent)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <button 
                        onClick={() => isEditingChecklist && toggleStatus(item.id)}
                        style={{ 
                            width: '32px', height: '32px', borderRadius: '8px', 
                            border: '2px solid ' + (item.status === 'passed' ? 'var(--success)' : (item.status === 'failed' ? 'var(--danger)' : 'var(--border-color)')),
                            background: item.status === 'passed' ? 'rgba(50, 215, 75, 0.1)' : (item.status === 'failed' ? 'rgba(255, 69, 58, 0.1)' : 'transparent'),
                            color: item.status === 'passed' ? 'var(--success)' : (item.status === 'failed' ? 'var(--danger)' : 'var(--text-secondary)'),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: isEditingChecklist ? 'pointer' : 'default',
                            fontSize: '1.2rem', fontWeight: '900', transition: 'all 0.2s ease'
                        }}
                      >
                        {item.status === 'passed' ? '✓' : (item.status === 'failed' ? '✗' : '–')}
                      </button>
                      <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '1rem' }}>{item.label}</div>
                          
                          {/* Persistent Notes Display */}
                          {(item.notes || isEditingChecklist) && (
                            <div style={{ marginTop: '0.4rem' }}>
                              {isEditingChecklist ? (
                                <input 
                                  type="text" 
                                  value={item.notes || ''} 
                                  onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                  placeholder="Add technical notes..."
                                  style={{ width: '100%', background: 'var(--bg-accent)', border: 'none', borderBottom: '1px solid var(--accent-color)', color: 'var(--text-primary)', fontSize: '0.85rem', padding: '0.3rem 0', outline: 'none' }}
                                />
                              ) : (
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', opacity: 0.8 }}>
                                  📝 {item.notes}
                                </p>
                              )}
                            </div>
                          )}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                        {item.category}
                      </div>
                  </div>
              ))}
          </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginTop: '2rem' }}>
          {/* Strategic Observations */}
          <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Strategic Site Observations</h3>
              <textarea 
                  value={observations}
                  onChange={(e) => {
                      setObservations(e.target.value)
                      syncToParent(null, null, e.target.value)
                  }}
                  readOnly={isReadOnly}
                  placeholder="Record critical structural deviations, site accessibility issues, or technical blockers..."
                  style={{ width: '100%', minHeight: '150px', background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: '1.6', outline: 'none' }}
              />
          </div>

          {/* Photo Evidence */}
          <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0 }}>Site Evidence</h3>
                  {!isReadOnly && (
                    <label className="btn btn-outline" style={{ cursor: 'pointer', fontSize: '0.8rem' }}>
                        + Add Photo
                        <input type="file" hidden accept="image/*" onChange={handlePhotoUpload} />
                    </label>
                  )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
                  {(photos || []).map((photo, i) => (
                      <div key={i} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                          <img src={photo} alt={`Site evidence ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {!isReadOnly && (
                            <button 
                                onClick={() => {
                                    const newPhotos = photos.filter((_, idx) => idx !== i)
                                    setPhotos(newPhotos)
                                    syncToParent(null, newPhotos, null)
                                }}
                                style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255, 69, 58, 0.8)', border: 'none', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '0.6rem' }}
                            >✕</button>
                          )}
                      </div>
                  ))}
                  {(photos || []).length === 0 && (
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.8rem', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                          No visual evidence uploaded yet.
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  )
}

export default SiteReadiness
