import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/tokens.css'
import './styles/global.css'
import OnboardingScreen from './components/OnboardingScreen'
import GlassLab from './components/GlassLab'
import FlutedGlassLab from './components/FlutedGlassLab'
import ChainLab from './components/ChainLab'
import GlassFireLab from './components/GlassFireLab'
import WavesLab from './components/WavesLab'
import MeshLab from './components/MeshLab'

const lab = new URLSearchParams(window.location.search).get('lab')

function Switcher() {
  const btn = (active: boolean): React.CSSProperties => ({
    width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
    fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
    background: active ? '#2563eb' : '#ffffff', color: active ? '#fff' : '#334155',
    boxShadow: '0 2px 8px rgba(15,23,42,0.18)', transition: 'all .15s',
  })
  return (
    <div style={{ position: 'fixed', left: 16, bottom: 16, display: 'flex', gap: 8, zIndex: 9999 }}>
      <button style={btn(lab === 'waves')} title="Waves" onClick={() => { window.location.search = '?lab=waves' }}>1</button>
      <button style={btn(lab === 'mesh')} title="Mesh" onClick={() => { window.location.search = '?lab=mesh' }}>2</button>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {lab === 'glass' ? <GlassLab />
      : lab === 'fluted' ? <FlutedGlassLab />
      : lab === 'chain' ? <ChainLab />
      : lab === 'glassfire' ? <GlassFireLab />
      : lab === 'waves' ? <WavesLab />
      : lab === 'mesh' ? <MeshLab />
      : <OnboardingScreen />}
    {(lab === 'waves' || lab === 'mesh') && <Switcher />}
  </React.StrictMode>,
)
