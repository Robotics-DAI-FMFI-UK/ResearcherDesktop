import { useState, useEffect } from 'react'
import { Outlet, useSearchParams, useNavigate } from 'react-router-dom'
import Navbar from '../Navbar/Navbar'
import Sidebar from '../Sidebar/Sidebar'
import { getCategories } from '../../api/categories'
import { useAuth } from '../../auth/AuthContext/AuthContext'
import './Layout.css'

export default function Layout() {
  const [categories, setCategories] = useState([])
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { mode } = useAuth()

  const selectedId = searchParams.get('categoryId') || null

  function setSelectedId(id) {
    if (id) { navigate(`/?categoryId=${id}`) }
    else { navigate('/') }
  }

  async function fetchCategories() {
    try {
      const { data } = await getCategories()
      setCategories(data)
    } catch {
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const selectedCategory = categories.find((c) => c.id === selectedId) ?? null

  return (
    <>
      <Navbar />
      <Sidebar
        categories={categories}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCategoriesChange={fetchCategories}
        mode={mode}
      />
      <main className="main-content">
        <Outlet context={{ categories, selectedCategory, selectedId, onCategoriesChange: fetchCategories, mode }} />
      </main>
    </>
  )
}
