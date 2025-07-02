'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { JsonEditorModal } from './json-editor-modal'
import { ArticleEditorModal } from './article-editor-modal'
import { 
  Plus, 
  Minus, 
  Edit2, 
  ChevronDown, 
  ChevronRight, 
  Copy,
  Trash2,
  Type,
  Hash,
  ToggleLeft,
  FileText,
  Braces,
  Brackets
} from 'lucide-react'

interface JsonEditorProps {
  data: any
  onChange: (data: any) => void
  className?: string
  searchTerm?: string
  onModalClose?: () => void
}

interface JsonNodeProps {
  value: any
  keyName?: string
  onEdit: (newValue: any, path: string[], newKey?: string) => void
  onDelete: (path: string[]) => void
  onAdd: (path: string[], type: 'object' | 'array') => void
  path: string[]
  level: number
  searchTerm?: string
  onModalClose?: () => void
}

const getValueType = (value: any): string => {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  return typeof value
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'string': return <Type className="w-3 h-3" />
    case 'number': return <Hash className="w-3 h-3" />
    case 'boolean': return <ToggleLeft className="w-3 h-3" />
    case 'null': return <FileText className="w-3 h-3" />
    case 'object': return <Braces className="w-3 h-3" />
    case 'array': return <Brackets className="w-3 h-3" />
    default: return <FileText className="w-3 h-3" />
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'string': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
    case 'number': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
    case 'boolean': return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
    case 'null': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    case 'object': return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100'
    case 'array': return 'bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-100'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
}

const JsonNode: React.FC<JsonNodeProps> = ({ 
  value, 
  keyName, 
  onEdit, 
  onDelete, 
  onAdd, 
  path, 
  level,
  searchTerm,
  onModalClose
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false)
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    value: any
    key: string
    type: string
    isEditingKey?: boolean
    title?: string
  }>({
    isOpen: false,
    value: null,
    key: '',
    type: 'string'
  })

  const valueType = getValueType(value)
  const isExpandable = valueType === 'object' || valueType === 'array'
  const isRoot = path.length === 0
  const isNumericSearch = !!(searchTerm && /^\d+$/.test(searchTerm))

  const isArticleSearchMatch = 
    isNumericSearch &&
    path.includes('articles') &&
    valueType === 'object' &&
    value !== null &&
    value.id === `article_${searchTerm}`

  const isHighlighted = searchTerm ? (
    isArticleSearchMatch ||
    (!isNumericSearch && searchTerm.length > 1 && (
      (keyName && keyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (typeof value === 'number' && value.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    ))
  ) : false

  const openEditModal = useCallback((editValue: any, editKey: string, isEditingKey = false) => {
    setModalState({
      isOpen: true,
      value: editValue,
      key: editKey,
      type: getValueType(editValue),
      isEditingKey,
      title: isEditingKey ? 'Edit Property Name' : 'Edit Value'
    })
  }, [])

  const prevIsArticleSearchMatchRef = useRef(false)

  useEffect(() => {
    if (isArticleSearchMatch && !prevIsArticleSearchMatchRef.current) {
      setIsArticleModalOpen(true)
    }
    
    prevIsArticleSearchMatchRef.current = !!isArticleSearchMatch
  }, [isArticleSearchMatch])

  const handleModalSave = (newValue: any, newKey?: string) => {
    if (modalState.isEditingKey && newKey) {
      // Handle key rename
      const parentPath = path.slice(0, -1)
      onDelete(path)
      onEdit(newValue, [...parentPath, newKey])
    } else {
      onEdit(newValue, path, newKey)
    }
    setModalState(prev => ({ ...prev, isOpen: false }))
    if (isArticleSearchMatch) {
      onModalClose?.()
    }
  }

  const handleArticleSave = (updatedArticle: any) => {
    onEdit(updatedArticle, path)
  }

  const handleAddItem = (type: 'object' | 'array') => {
    if (valueType === 'object') {
      const newKey = `newProperty${Object.keys(value).length + 1}`
      onEdit(type === 'object' ? {} : [], [...path, newKey])
    } else if (valueType === 'array') {
      onEdit(type === 'object' ? {} : [], [...path, value.length.toString()])
    }
  }

  const renderValue = () => {
    if (valueType === 'string') {
      return (
        <span className="text-green-600 dark:text-green-400 font-mono">
          "{value.length > 100 ? `${value.substring(0, 100)}...` : value}"
        </span>
      )
    }
    if (valueType === 'number') {
      return <span className="text-blue-600 dark:text-blue-400 font-mono">{value}</span>
    }
    if (valueType === 'boolean') {
      return <span className="text-purple-600 dark:text-purple-400 font-mono">{String(value)}</span>
    }
    if (valueType === 'null') {
      return <span className="text-muted-foreground font-mono">null</span>
    }
    return null
  }

  const renderCollapsedPreview = () => {
    if (valueType === 'object') {
      const keys = Object.keys(value)
      return (
        <span className="text-muted-foreground font-mono">
          {`{ ${keys.length} ${keys.length === 1 ? 'property' : 'properties'} }`}
        </span>
      )
    }
    if (valueType === 'array') {
      return (
        <span className="text-muted-foreground font-mono">
          {`[ ${value.length} ${value.length === 1 ? 'item' : 'items'} ]`}
        </span>
      )
    }
    return null
  }

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/50 group ${
          level === 0 ? 'bg-muted/50' : ''
        } ${isHighlighted ? 'bg-yellow-100 dark:bg-yellow-800/30' : ''}`}
        style={{ marginLeft: `${level * 20}px` }}
      >
        {isExpandable && (
          <Button
            variant="ghost"
            size="sm"
            className="w-5 h-5 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
          </Button>
        )}
        
        {keyName && (
          <div className="flex items-center gap-1">
            <span className="font-medium text-foreground font-mono">{keyName}</span>
            <Button
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0 opacity-0 group-hover:opacity-100"
              onClick={() => openEditModal(value, keyName, true)}
            >
              <Edit2 className="w-3 h-3 text-muted-foreground" />
            </Button>
            <span className="text-muted-foreground">:</span>
          </div>
        )}

        <Badge 
          variant="secondary" 
          className={`px-1 py-0 text-xs h-5 ${getTypeColor(valueType)}`}
        >
          {getTypeIcon(valueType)}
          <span className="ml-1">{valueType}</span>
        </Badge>

        <div className="flex-1 flex items-center gap-2">
          {!isExpandable ? (
            <>
              {renderValue()}
              <Button
                variant="ghost"
                size="sm"
                className="w-4 h-4 p-0 opacity-0 group-hover:opacity-100"
                onClick={() => openEditModal(value, keyName || '')}
              >
                <Edit2 className="w-3 h-3 text-muted-foreground" />
              </Button>
            </>
          ) : (
            <>
              {!isExpanded && renderCollapsedPreview()}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-4 h-4 p-0"
                  onClick={() => openEditModal(value, keyName || '')}
                  title="Edit entire object/array"
                >
                  <Edit2 className="w-3 h-3 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-4 h-4 p-0"
                  onClick={() => handleAddItem('object')}
                  title="Add object property"
                >
                  <Plus className="w-3 h-3 text-muted-foreground" />
                </Button>
                 <Button
                  variant="ghost"
                  size="sm"
                  className="w-4 h-4 p-0"
                  onClick={() => handleAddItem('array')}
                  title="Add array element"
                >
                  <Plus className="w-3 h-3 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-4 h-4 p-0"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(value, null, 2))
                  }}
                  title="Copy"
                >
                  <Copy className="w-3 h-3 text-muted-foreground" />
                </Button>
                {!isRoot && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-4 h-4 p-0"
                    onClick={() => onDelete(path)}
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {isExpandable && isExpanded && (
        <div className="border-l border-border">
          {valueType === 'object' &&
            Object.entries(value).map(([key, childValue]) => (
              <JsonNode
                key={key}
                keyName={key}
                value={childValue}
                onEdit={onEdit}
                onDelete={onDelete}
                onAdd={onAdd}
                path={[...path, key]}
                level={level + 1}
                searchTerm={searchTerm}
                onModalClose={onModalClose}
              />
            ))}
          {valueType === 'array' &&
            value.map((item: any, index: number) => (
              <JsonNode
                key={index}
                keyName={index.toString()}
                value={item}
                onEdit={onEdit}
                onDelete={onDelete}
                onAdd={onAdd}
                path={[...path, index.toString()]}
                level={level + 1}
                searchTerm={searchTerm}
                onModalClose={onModalClose}
              />
            ))}
        </div>
      )}

      {isArticleSearchMatch && (
        <ArticleEditorModal
          isOpen={isArticleModalOpen}
          onClose={() => {
            setIsArticleModalOpen(false)
            onModalClose?.()
          }}
          onSave={handleArticleSave}
          article={value}
        />
      )}

      <JsonEditorModal 
        isOpen={modalState.isOpen && !isArticleSearchMatch}
        onClose={() => {
          setModalState(prev => ({...prev, isOpen: false}))
          if (isArticleSearchMatch) {
            onModalClose?.()
          }
        }}
        onSave={handleModalSave}
        currentValue={modalState.value}
        currentKey={modalState.key}
        valueType={modalState.type}
        isEditingKey={modalState.isEditingKey}
        title={modalState.title}
      />
    </div>
  )
}

export const JsonEditor: React.FC<JsonEditorProps> = ({ 
  data, 
  onChange, 
  className,
  searchTerm,
  onModalClose
}) => {
  const [internalData, setInternalData] = useState(data)

  useEffect(() => {
    setInternalData(data)
  }, [data])

  const handleEdit = (newValue: any, path: string[], newKey?: string) => {
    setInternalData((currentData: any) => {
      const newData = JSON.parse(JSON.stringify(currentData))
      let currentLevel = newData
      
      for (let i = 0; i < path.length - 1; i++) {
        currentLevel = currentLevel[path[i]]
      }

      const finalKey = path[path.length - 1]
      if (newKey !== undefined) {
        delete currentLevel[finalKey]
        currentLevel[newKey] = newValue
      } else {
        currentLevel[finalKey] = newValue
      }
      
      onChange(newData)
      return newData
    })
  }

  const handleDelete = (path: string[]) => {
    setInternalData((currentData: any) => {
      const newData = JSON.parse(JSON.stringify(currentData))
      let currentLevel = newData

      for (let i = 0; i < path.length - 1; i++) {
        currentLevel = currentLevel[path[i]]
      }

      const finalKey = path[path.length - 1]
      if (Array.isArray(currentLevel)) {
        currentLevel.splice(parseInt(finalKey), 1)
      } else {
        delete currentLevel[finalKey]
      }
      
      onChange(newData)
      return newData
    })
  }

  const handleAdd = (path: string[], type: 'object' | 'array') => {
    setInternalData((currentData: any) => {
      const newData = JSON.parse(JSON.stringify(currentData))
      let currentLevel = newData
      
      for (let i = 0; i < path.length; i++) {
        currentLevel = currentLevel[path[i]]
      }

      if (Array.isArray(currentLevel)) {
        currentLevel.push(type === 'object' ? {} : [])
      } else if (typeof currentLevel === 'object' && currentLevel !== null) {
        const newKey = `new_key_${Object.keys(currentLevel).length}`
        currentLevel[newKey] = type === 'object' ? {} : []
      }
      
      onChange(newData)
      return newData
    })
  }
  
  return (
    <div className={className}>
      <JsonNode
        value={internalData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        path={[]}
        level={0}
        searchTerm={searchTerm}
        onModalClose={onModalClose}
      />
    </div>
  )
} 