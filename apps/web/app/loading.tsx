export default function Loading() {
  return (
    <main className="container" style={{ padding: '32px 16px' }} aria-busy="true" aria-label="Loading">
      <div className="skel-block" style={{ height: 28, width: '40%', marginBottom: 16 }} />
      <div className="skel-block" style={{ height: 120, marginBottom: 12 }} />
      <div className="skel-block" style={{ height: 120, marginBottom: 12 }} />
      <div className="skel-block" style={{ height: 80 }} />
    </main>
  )
}
