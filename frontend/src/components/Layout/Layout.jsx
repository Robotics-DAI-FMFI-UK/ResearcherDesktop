import { useState } from 'react'
import { Outlet, useSearchParams, useNavigate } from 'react-router-dom'
import Navbar from '../Navbar/Navbar'
import Sidebar from '../Sidebar/Sidebar'
import { useCategories } from '../../hooks/useCategories'
import './Layout.css'

export default function Layout() {
  const { categories, refetch, createCategory, updateCategory, deleteCategory } = useCategories()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const selectedId = searchParams.get('categoryId') || null

  function setSelectedId(id) {
    if (id) { navigate(`/?categoryId=${id}`) }
    else { navigate('/') }
  }

  const selectedCategory = categories.find((c) => c.id === selectedId) ?? null

  return (
    <>
      <Navbar />
      <Sidebar
        categories={categories}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreate={createCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
      />
      <main className="main-content">
        <Outlet context={{ categories, selectedCategory, selectedId, onCategoriesChange: refetch, updateCategory }} />
      </main>
    </>
  )
}
