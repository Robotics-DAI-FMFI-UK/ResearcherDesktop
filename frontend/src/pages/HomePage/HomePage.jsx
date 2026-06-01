import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useOutletContext } from 'react-router-dom'
import { Icon } from '../../utils/icons'
import CategoryDetail from '../../components/CategoryDetail/CategoryDetail'
import ItemList from '../../components/ItemList/ItemList'
import { useGmail } from '../../hooks/useGmail'
import '../../components/CategoryModal/CategoryModal.css'
import './HomePage.css'

function GmailScanModal({ onClose, onImported }) {
  const { scanGmail, importConference } = useGmail()
  const [conferences, setConferences] = useState(null)
  const [addToCalendar, setAddToCalendar] = useState({})
  const [importing, setImporting] = useState(new Set())
  const [imported, setImported] = useState(new Set())
  const [scanning, setScanning] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    scanGmail()
      .then((r) => {
        setConferences(r.data)
        const cal = {}
        r.data.forEach((_, i) => { cal[i] = true })
        setAddToCalendar(cal)
      })
      .catch(() => setError('Failed to scan Gmail. Make sure Google Calendar is connected.'))
      .finally(() => setScanning(false))
  }, [])

  async function handleImport(conf, index) {
    setImporting((prev) => new Set([...prev, index]))
    try {
      await importConference({ conference: conf, addToCalendar: addToCalendar[index] ?? true })
      setImported((prev) => new Set([...prev, index]))
      onImported()
    } catch {
    } finally {
      setImporting((prev) => { const s = new Set(prev); s.delete(index); return s })
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Scan Gmail for Conferences</h2>

        {scanning && <p className="gmail-scan-status">Scanning your inbox…</p>}
        {error && <p className="modal-error">{error}</p>}

        {!scanning && conferences?.length === 0 && (
          <p className="gmail-scan-empty">No conference-related emails found in the last 90 days.</p>
        )}

        {conferences?.length > 0 && (
          <div className="gmail-scan-list">
            {conferences.map((conf, i) => (
              <div key={i} className="gmail-scan-row">
                <div className="gmail-scan-info">
                  <span className="gmail-scan-title">{conf.title || conf.emailSubject}</span>
                  {conf.deadline && <span className="gmail-scan-deadline">Deadline: {conf.deadline}</span>}
                  {(conf.startDate || conf.endDate) && (
                    <span className="gmail-scan-dates">
                      Dates: {conf.startDate}{conf.endDate && conf.endDate !== conf.startDate ? ` – ${conf.endDate}` : ''}
                    </span>
                  )}
                  {conf.location && <span className="gmail-scan-location">{conf.location}</span>}
                  {conf.url && (
                    <a href={conf.url} target="_blank" rel="noreferrer" className="gmail-scan-url">
                      {conf.url}
                    </a>
                  )}
                </div>
                <div className="gmail-scan-actions">
                  {!conf.alreadyImported && !imported.has(i) && (
                    <label className="gmail-scan-calendar-check">
                      <input
                        type="checkbox"
                        checked={addToCalendar[i] ?? true}
                        onChange={(e) => setAddToCalendar((prev) => ({ ...prev, [i]: e.target.checked }))}
                        style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
                      />
                      Add to Calendar
                    </label>
                  )}
                  {conf.alreadyImported || imported.has(i) ? (
                    <span className="gmail-scan-done">Imported ✓</span>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary gmail-scan-import-btn"
                      onClick={() => handleImport(conf, i)}
                      disabled={importing.has(i)}
                    >
                      {importing.has(i) ? '…' : 'Import'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: '1rem' }}>
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function HomePage() {
  const { selectedCategory, selectedId, categories, onCategoriesChange, updateCategory } = useOutletContext()
  const [gmailScanOpen, setGmailScanOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [itemRefreshSignal, setItemRefreshSignal] = useState(0)

  function handleImported() {
    onCategoriesChange()
    setItemRefreshSignal((s) => s + 1)
  }

  const totalCount = categories.reduce((sum, c) => sum + (c.itemCount || 0), 0)
  const displayCount = selectedCategory ? selectedCategory.itemCount : totalCount
  const isConferences = selectedCategory?.name === 'Conferences'

  return (
    <div className="home">
      <div className="home-header">
        {selectedCategory && (
          <span className="home-header-icon">
            <Icon name={selectedCategory.icon || 'folder'} size={20} />
          </span>
        )}
        <h1 className="home-title">
          {selectedCategory ? selectedCategory.name : 'All Data'}
        </h1>
        {displayCount > 0 && (
          <span className="home-title-count">{displayCount}</span>
        )}
        <div className="home-header-actions">
          {isConferences && (
            <button className="gmail-scan-btn" onClick={() => setGmailScanOpen(true)}>
              <Icon name="mail" size={14} />
              Scan Gmail
            </button>
          )}
          {displayCount > 0 && (
            <button className="new-item-btn" onClick={() => setUploadOpen(true)}>
              <Icon name="plus" size={14} />
              New item
            </button>
          )}
        </div>
      </div>

      {selectedCategory && (
        <CategoryDetail
          category={selectedCategory}
          onUpdate={updateCategory}
        />
      )}

      <ItemList
        selectedId={selectedId}
        categories={categories}
        onCategoriesChange={onCategoriesChange}
        uploadOpen={uploadOpen}
        onOpenUpload={() => setUploadOpen(true)}
        onCloseUpload={() => setUploadOpen(false)}
        refreshSignal={itemRefreshSignal}
      />

      {gmailScanOpen && (
        <GmailScanModal
          onClose={() => setGmailScanOpen(false)}
          onImported={handleImported}
        />
      )}
    </div>
  )
}
