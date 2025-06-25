'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { JsonEditorModal } from './json-editor-modal'
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
}

interface JsonNodeProps {
  value: any
  keyName?: string
  onEdit: (newValue: any, path: string[], newKey?: string) => void
  onDelete: (path: string[]) => void
  onAdd: (path: string[], type: 'object' | 'array') => void
  path: string[]
  level: number
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
    case 'string': return 'bg-blue-100 text-blue-800'
    case 'number': return 'bg-green-100 text-green-800'
    case 'boolean': return 'bg-purple-100 text-purple-800'
    case 'null': return 'bg-gray-100 text-gray-800'
    case 'object': return 'bg-orange-100 text-orange-800'
    case 'array': return 'bg-pink-100 text-pink-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const JsonNode: React.FC<JsonNodeProps> = ({ 
  value, 
  keyName, 
  onEdit, 
  onDelete, 
  onAdd, 
  path, 
  level 
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2)
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

  const openEditModal = (editValue: any, editKey: string, isEditingKey = false) => {
    setModalState({
      isOpen: true,
      value: editValue,
      key: editKey,
      type: getValueType(editValue),
      isEditingKey,
      title: isEditingKey ? 'Edit Property Name' : 'Edit Value'
    })
  }

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
        <span className="text-green-600 font-mono">
          "{value.length > 100 ? `${value.substring(0, 100)}...` : value}"
        </span>
      )
    }
    if (valueType === 'number') {
      return <span className="text-blue-600 font-mono">{value}</span>
    }
    if (valueType === 'boolean') {
      return <span className="text-purple-600 font-mono">{String(value)}</span>
    }
    if (valueType === 'null') {
      return <span className="text-gray-500 font-mono">null</span>
    }
    return null
  }

  const renderCollapsedPreview = () => {
    if (valueType === 'object') {
      const keys = Object.keys(value)
      return (
        <span className="text-gray-500 font-mono">
          {`{ ${keys.length} ${keys.length === 1 ? 'property' : 'properties'} }`}
        </span>
      )
    }
    if (valueType === 'array') {
      return (
        <span className="text-gray-500 font-mono">
          {`[ ${value.length} ${value.length === 1 ? 'item' : 'items'} ]`}
        </span>
      )
    }
    return null
  }

  return (
    <div className="select-none">
      <div 
        className={`flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-50 group ${
          level === 0 ? 'bg-gray-50' : ''
        }`}
        style={{ marginLeft: `${level * 20}px` }}
      >
        {/* Expand/Collapse button */}
        {isExpandable && (
          <Button
            variant="ghost"
            size="sm"
            className="w-5 h-5 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </Button>
        )}
        
        {/* Key */}
        {keyName && (
          <div className="flex items-center gap-1">
            <span className="font-medium text-gray-700 font-mono">{keyName}</span>
            <Button
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0 opacity-0 group-hover:opacity-100"
              onClick={() => openEditModal(value, keyName, true)}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            <span className="text-gray-500">:</span>
          </div>
        )}

        {/* Type badge */}
        <Badge 
          variant="secondary" 
          className={`px-1 py-0 text-xs h-5 ${getTypeColor(valueType)}`}
        >
          {getTypeIcon(valueType)}
          <span className="ml-1">{valueType}</span>
        </Badge>

        {/* Value */}
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
                <Edit2 className="w-3 h-3" />
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
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-4 h-4 p-0"
                  onClick={() => handleAddItem('object')}
                  title="Add object"
                >
                  <Plus className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-4 h-4 p-0"
                  onClick={() => handleAddItem('array')}
                  title="Add array"
                >
                  <Brackets className="w-3 h-3" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Delete button */}
        {!isRoot && (
          <Button
            variant="ghost"
            size="sm"
            className="w-4 h-4 p-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
            onClick={() => onDelete(path)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Children */}
      {isExpanded && isExpandable && (
        <div>
          {valueType === 'object' && 
            Object.entries(value).map(([key, val]) => (
              <JsonNode
                key={key}
                value={val}
                keyName={key}
                onEdit={onEdit}
                onDelete={onDelete}
                onAdd={onAdd}
                path={[...path, key]}
                level={level + 1}
              />
            ))
          }
          {valueType === 'array' && 
            value.map((val: any, index: number) => (
              <JsonNode
                key={index}
                value={val}
                keyName={`[${index}]`}
                onEdit={onEdit}
                onDelete={onDelete}
                onAdd={onAdd}
                path={[...path, index.toString()]}
                level={level + 1}
              />
            ))
          }
        </div>
      )}

      <JsonEditorModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
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
  className 
}) => {
  const handleEdit = (newValue: any, path: string[], newKey?: string) => {
    const newData = JSON.parse(JSON.stringify(data))
    
    // Navigate to the parent and set the value
    let current = newData
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }
    
    if (path.length === 0) {
      onChange(newValue)
    } else {
      const lastKey = path[path.length - 1]
      if (newKey && newKey !== lastKey) {
        // Rename operation
        delete current[lastKey]
        current[newKey] = newValue
      } else {
        current[lastKey] = newValue
      }
      onChange(newData)
    }
  }

  const handleDelete = (path: string[]) => {
    if (path.length === 0) return
    
    const newData = JSON.parse(JSON.stringify(data))
    let current = newData
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }
    
    const lastKey = path[path.length - 1]
    if (Array.isArray(current)) {
      current.splice(parseInt(lastKey), 1)
    } else {
      delete current[lastKey]
    }
    
    onChange(newData)
  }

  const handleAdd = (path: string[], type: 'object' | 'array') => {
    // This is handled by the individual nodes
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="max-h-96 overflow-y-auto">
          <JsonNode
            value={data}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            path={[]}
            level={0}
          />
        </div>
      </CardContent>
    </Card>
  )
} 