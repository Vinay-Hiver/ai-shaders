import React, { useState } from 'react'
import './OnboardingScreen.css'
import WavesLab from './WavesLab'
import MeshLab from './MeshLab'

export default function OnboardingScreen() {
  const [opt, setOpt] = useState<1 | 2>(1)
  const swBtn = (active: boolean): React.CSSProperties => ({
    width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
    fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
    background: active ? '#2563eb' : '#ffffff', color: active ? '#fff' : '#334155',
    boxShadow: '0 2px 8px rgba(15,23,42,0.18)', transition: 'all .15s',
  })
  return (
    <div className="onboarding">
      {/* ---------------- Left: form panel ---------------- */}
      <section className="panel panel--form">
        <div className="form-column">
          {/* Top group */}
          <div className="form-top">
            <img
              className="logo"
              src="/assets/hiver-logo.png"
              alt="Hiver Omni"
              width={105}
              height={44}
            />

            <div className="form-body">
              {/* Progress */}
              <div className="progress-row">
                <button type="button" className="icon-button" aria-label="Go back">
                  <img src="/assets/icon-back.svg" alt="" width={14} height={14} />
                </button>
                <div className="progress" role="progressbar" aria-valuenow={1} aria-valuemin={1} aria-valuemax={3}>
                  <span className="progress__fill" />
                </div>
                <span className="progress__label">1 of 3</span>
              </div>

              {/* Title */}
              <div className="title-container">
                <h1 className="title">Setup your Hiver AI agent</h1>
                <p className="subtitle">
                  Just add your website and Hiver AI will analyze public pages,
                  help center articles, and FAQs to train your AI agent
                </p>
              </div>

              {/* Form */}
              <div className="form-fields">
                <label className="field-group">
                  <span className="field-label">Website URL</span>
                  <div className="input">
                    <span className="input__prefix">https://</span>
                    <input
                      className="input__control"
                      type="text"
                      inputMode="url"
                      aria-label="Website URL"
                    />
                  </div>
                </label>

                <button type="button" className="btn btn--primary">Continue</button>
              </div>

              {/* Terms */}
              <p className="terms">
                By continuing you agree to our <a href="#terms">Terms</a> and that
                you have read our <a href="#privacy">Privacy Policy</a>
              </p>
            </div>
          </div>

          {/* Bottom: help */}
          <div className="help">
            <span className="help__label">Need help?</span>
            <button type="button" className="btn btn--ghost">
              <img src="/assets/icon-chat.svg" alt="" width={14} height={14} />
              <span>Chat with us</span>
            </button>
          </div>
        </div>
      </section>

      {/* ---------------- Right: shader placeholder ---------------- */}
      <section className="panel panel--visual" aria-hidden="true">
        <div className="shader-placeholder" data-shader-slot style={{ position: 'relative' }}>
          {/* Both kept mounted so their state survives switching */}
          <div style={{ position: 'absolute', inset: 0, opacity: opt === 1 ? 1 : 0, pointerEvents: opt === 1 ? 'auto' : 'none' }}>
            <WavesLab embed active={opt === 1} />
          </div>
          <div style={{ position: 'absolute', inset: 0, opacity: opt === 2 ? 1 : 0, pointerEvents: opt === 2 ? 'auto' : 'none' }}>
            <MeshLab embed active={opt === 2} />
          </div>
        </div>
      </section>

      {/* Shader option switcher */}
      <div style={{ position: 'fixed', left: 16, bottom: 16, display: 'flex', gap: 8, zIndex: 9999 }}>
        <button style={swBtn(opt === 1)} title="Waves" onClick={() => setOpt(1)}>1</button>
        <button style={swBtn(opt === 2)} title="Mesh" onClick={() => setOpt(2)}>2</button>
      </div>
    </div>
  )
}
