import { Suspense, lazy } from 'react'

const Admin = lazy(() => import('@pages/admin'))

function App() {
  return (
    <Suspense fallback={<div style={{ color: '#666', textAlign: 'center', padding: 40 }}>Loading...</div>}>
      <Admin />
    </Suspense>
  )
}

export default App
