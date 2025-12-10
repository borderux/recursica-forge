import { useState } from 'react'
import ComponentToolbar from './ComponentToolbar'
import ButtonPreview from './ButtonPreview'
import './ComponentsPage.css'

export default function ComponentsPage() {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({
    color: 'solid',
    size: 'default',
  })
  const [selectedLayer, setSelectedLayer] = useState('layer-0')
  const [selectedAltLayer, setSelectedAltLayer] = useState<string | null>(null)

  const handleVariantChange = (prop: string, variant: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [prop]: variant,
    }))
  }

  return (
    <div className="components-page">
      <div className="components-page-header">
        <h1>Components</h1>
        <p>Edit component properties using the toolbar below.</p>
      </div>
      <ComponentToolbar
        componentName="button"
        selectedVariants={selectedVariants}
        selectedLayer={selectedLayer}
        selectedAltLayer={selectedAltLayer}
        onVariantChange={handleVariantChange}
        onLayerChange={setSelectedLayer}
        onAltLayerChange={setSelectedAltLayer}
      />
      <div className="components-page-content">
        <ButtonPreview
          selectedVariants={selectedVariants}
          selectedLayer={selectedLayer}
          selectedAltLayer={selectedAltLayer}
        />
      </div>
    </div>
  )
}
