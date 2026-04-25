import { useState } from 'react'

const AdminPanel = ({ users = [], onAddUser, onRemoveUser, onResetUser }) => {
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Admin' })

    const handleSubmit = (e) => {
        e.preventDefault()
        onAddUser(newUser)
        setNewUser({ name: '', email: '', role: 'Admin' })
    }

    return (
        <div className="admin-panel animate-fade-in" style={{ padding: '1rem 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                
                {/* USER LIST */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Active Team Members</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {users.map(u => (
                            <div key={u.email} style={{ 
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                                        {u.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: '700' }}>{u.name || 'User Setup Pending'}</p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email} • <span style={{ color: 'var(--accent-color)' }}>{u.role}</span></p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem', borderRadius: '4px', background: u.isNew ? '#f39c12' : 'var(--success)', color: '#fff' }}>
                                        {u.isNew ? 'Setup Pending' : 'Active'}
                                    </span>
                                    {u.email !== 'ravi.bhargaw@meaven.in' && (
                                        <>
                                            <button 
                                                title="Reset Credentials"
                                                onClick={() => { if(confirm(`Reset credentials for ${u.name}?`)) onResetUser(u.email) }}
                                                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '1rem' }}
                                            >
                                                🔄
                                            </button>
                                            <button 
                                                title="Remove User"
                                                onClick={() => { if(confirm(`Remove ${u.name} from system?`)) onRemoveUser(u.email) }}
                                                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem' }}
                                            >
                                                🗑️
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ADD USER FORM */}
                <div className="card" style={{ background: 'rgba(102, 178, 194, 0.05)', border: '1px solid var(--accent-color)' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Invite New Admin</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                        Add a new team member. They will be prompted to set their custom password and PIN upon first login.
                    </p>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Full Name</label>
                            <input 
                                type="text" 
                                required
                                value={newUser.name}
                                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} 
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Email Address</label>
                            <input 
                                type="email" 
                                required
                                value={newUser.email}
                                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }} 
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Governance Role</label>
                            <select 
                                value={newUser.role}
                                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                                style={{ background: 'var(--bg-accent)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', color: '#fff' }}
                            >
                                <option value="Admin">Admin</option>
                                <option value="Editor">Project Editor</option>
                                <option value="Viewer">Viewer (Read-Only)</option>
                            </select>
                        </div>
                        
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            💡 Default credentials: <br/> 
                            Password: <b>password123</b> | PIN: <b>1234</b>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                            Initialize User Loop
                        </button>
                    </form>
                </div>

            </div>
        </div>
    )
}

export default AdminPanel
