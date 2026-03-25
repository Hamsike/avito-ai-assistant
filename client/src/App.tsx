import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from 'antd'
import { AdsList } from './components/AdsList/AdsList'
import { AdDetails } from './components/AdDetails/AdDetails'
import { AdForm } from './components/AdForm/AdForm'
import './App.css'
import { Header } from './components/Header/Header'

const { Content } = Layout

function App() {
  return (
    <BrowserRouter>
      <Layout >
        <Header/>
        <Content>
          <Routes>
            <Route path="/" element={<Navigate to="/ads" replace />} />
            <Route path="/ads" element={<AdsList />} />
            <Route path="/ads/:id" element={<AdDetails />} />
            <Route path="/ads/:id/edit" element={<AdForm />} />
          </Routes>
        </Content>
      </Layout>
    </BrowserRouter>
  )
}

export default App