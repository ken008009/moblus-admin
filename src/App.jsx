import { Suspense, lazy } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'

const Admin = lazy(() => import('@pages'))

const Loading = () => (
  <div style={{ color: '#666', textAlign: 'center', padding: 40 }}>Loading...</div>
)

function App() {
  return (
    <HashRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Admin />} />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
