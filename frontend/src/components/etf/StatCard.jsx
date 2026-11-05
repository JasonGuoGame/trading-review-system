const StatCard = ({ label, value, suffix = '', color = '#fff', sub, onClick, hint }) => (
  <div
    onClick={onClick}
    title={onClick ? hint : undefined}
    style={{
      background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '14px 16px', textAlign: 'center',
      border: '1px solid rgba(255,255,255,0.06)', height: '100%',
      cursor: onClick ? 'pointer' : 'default', transition: 'background 0.2s, border-color 0.2s',
    }}
    onMouseEnter={onClick ? (e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; } : undefined}
    onMouseLeave={onClick ? (e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; } : undefined}
  >
    <span style={{ fontSize: 11, color: '#8b949e', display: 'block' }}>{label}</span>
    <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1.3, marginTop: 4 }}>{value}{suffix}</div>
    {sub && <span style={{ fontSize: 10, color: '#8b949e' }}>{sub}</span>}
  </div>
)

export default StatCard
