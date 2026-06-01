import { useOutletContext } from 'react-router-dom'
import { Icon } from '../../utils/icons'
import CategoryDetail from '../../components/CategoryDetail/CategoryDetail'
import ItemList from '../../components/ItemList/ItemList'
import './HomePage.css'

export default function HomePage() {
  const { selectedCategory, selectedId, categories, onCategoriesChange } = useOutletContext()

  const totalCount = categories.reduce((sum, c) => sum + (c.itemCount || 0), 0)
  const displayCount = selectedCategory ? selectedCategory.itemCount : totalCount

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
      </div>

      {selectedCategory && (
        <CategoryDetail
          category={selectedCategory}
          onUpdated={onCategoriesChange}
        />
      )}

      <ItemList selectedId={selectedId} categories={categories} onCategoriesChange={onCategoriesChange} />
    </div>
  )
}
