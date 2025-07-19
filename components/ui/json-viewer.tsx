'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Plus, Minus, Edit3, Check, X } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'

interface JsonViewerProps {
  data: any
  name?: string
  onChange?: (newData: any) => void
}

interface JsonNodeProps {
  data: any
  name: string
  level: number
  path: string[]
  onChange: (path: string[], newValue: any) => void
  onDelete?: (path: string[]) => void
  onAdd?: (path: string[], key: string, value: any) => void
}

const JsonNode: React.FC<JsonNodeProps> = ({ 
  data, 
  name, 
  level, 
  path, 
  onChange, 
  onDelete, 
  onAdd 
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [editKey, setEditKey] = useState(name)
  const [isEditingKey, setIsEditingKey] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const getDataType = (value: any): string => {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    return typeof value
  }

  const parseValue = (value: string, currentType?: string): any => {
    try {
      // Try to parse as JSON first for objects/arrays
      if (value.startsWith('{') || value.startsWith('[')) {
        return JSON.parse(value)
      }
      
      // Check if it's a number
      if (!isNaN(Number(value)) && value.trim() !== '') {
        return Number(value)
      }
      
      // Check if it's a boolean
      if (value.toLowerCase() === 'true') return true
      if (value.toLowerCase() === 'false') return false
      
      // Check if it's null
      if (value.toLowerCase() === 'null') return null
      
      // Otherwise, return as string
      return value
    } catch {
      return value
    }
  }

  const handleValueEdit = () => {
    setEditValue(typeof data === 'string' ? data : JSON.stringify(data, null, 2))
    setIsEditing(true)
  }

  const handleValueSave = () => {
    const newValue = parseValue(editValue)
    onChange(path, newValue)
    setIsEditing(false)
  }

  const handleKeyEdit = () => {
    setEditKey(name)
    setIsEditingKey(true)
  }

  const handleKeySave = () => {
    if (editKey !== name && onDelete && onAdd) {
      const parentPath = path.slice(0, -1)
      onAdd(parentPath, editKey, data)
      onDelete(path)
    }
    setIsEditingKey(false)
  }

  const handleAdd = () => {
    if (newKey && onAdd) {
      const parsedValue = parseValue(newValue)
      onAdd(path, newKey, parsedValue)
      setNewKey('')
      setNewValue('')
      setShowAddForm(false)
    }
  }

  const handleArrayAdd = () => {
    if (onAdd) {
      const parsedValue = parseValue(newValue)
      const newIndex = Array.isArray(data) ? data.length.toString() : '0'
      onAdd(path, newIndex, parsedValue)
      setNewValue('')
      setShowAddForm(false)
    }
  }

  const handleDelete = () => {
    if (onDelete && confirm(`Delete "${name}"?`)) {
      onDelete(path)
    }
  }

  const getValueColor = (type: string): string => {
    switch (type) {
      case 'string': return 'text-green-600'
      case 'number': return 'text-blue-600'
      case 'boolean': return 'text-purple-600'
      case 'null': return 'text-gray-500'
      default: return 'text-gray-900'
    }
  }

  const renderValue = (value: any, key: string) => {
    const type = getDataType(value)
    
    if (type === 'object' && value !== null) {
      const keys = Object.keys(value)
      return (
        <div className="flex flex-col">
          <div className="flex items-center group">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center hover:bg-gray-100 rounded px-1 py-0.5 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
              {isEditingKey ? (
                <div className="flex items-center ml-1">
                  <Input
                    value={editKey}
                    onChange={(e) => setEditKey(e.target.value)}
                    className="h-6 text-sm w-24"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleKeySave()
                      if (e.key === 'Escape') setIsEditingKey(false)
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-1"
                    onClick={handleKeySave}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsEditingKey(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <span className="font-medium text-blue-700 ml-1">{key}:</span>
              )}
              <span className="text-gray-500 ml-2">
                {`{ ${keys.length} key${keys.length !== 1 ? 's' : ''} }`}
              </span>
            </button>
            <div className="opacity-0 group-hover:opacity-100 flex ml-2">
              {!isEditingKey && level > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleKeyEdit}
                  title="Edit key"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowAddForm(!showAddForm)}
                title="Add property"
              >
                <Plus className="h-3 w-3" />
              </Button>
              {level > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-500"
                  onClick={handleDelete}
                  title="Delete object"
                >
                  <Minus className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          {showAddForm && (
            <div className="ml-6 mt-2 flex items-center gap-2 p-2 bg-gray-50 rounded">
              <Input
                placeholder="Key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="h-8 text-sm w-24"
              />
              <Input
                placeholder="Value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="h-8 text-sm w-32"
              />
              <Button size="sm" onClick={handleAdd}>Add</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          )}
          {isExpanded && (
            <div className="ml-4 border-l border-gray-200 pl-4 mt-1">
              {keys.map((objKey) => (
                <JsonNode
                  key={objKey}
                  data={value[objKey]}
                  name={objKey}
                  level={level + 1}
                  path={[...path, objKey]}
                  onChange={onChange}
                  onDelete={onDelete}
                  onAdd={onAdd}
                />
              ))}
            </div>
          )}
        </div>
      )
    }

    if (type === 'array') {
      return (
        <div className="flex flex-col">
          <div className="flex items-center group">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center hover:bg-gray-100 rounded px-1 py-0.5 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
              <span className="font-medium text-blue-700 ml-1">{key}:</span>
              <span className="text-gray-500 ml-2">
                {`[ ${value.length} item${value.length !== 1 ? 's' : ''} ]`}
              </span>
            </button>
            <div className="opacity-0 group-hover:opacity-100 flex ml-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowAddForm(!showAddForm)}
                title="Add array item"
              >
                <Plus className="h-3 w-3" />
              </Button>
              {level > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-500"
                  onClick={handleDelete}
                  title="Delete array"
                >
                  <Minus className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          {showAddForm && (
            <div className="ml-6 mt-2 flex items-center gap-2 p-2 bg-gray-50 rounded">
              <Input
                placeholder="Value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="h-8 text-sm w-32"
              />
              <Button size="sm" onClick={handleArrayAdd}>Add</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          )}
          {isExpanded && (
            <div className="ml-4 border-l border-gray-200 pl-4 mt-1">
              {value.map((item: any, index: number) => (
                <JsonNode
                  key={index}
                  data={item}
                  name={index.toString()}
                  level={level + 1}
                  path={[...path, index.toString()]}
                  onChange={onChange}
                  onDelete={onDelete}
                  onAdd={onAdd}
                />
              ))}
            </div>
          )}
        </div>
      )
    }

    // Primitive values
    return (
      <div className="flex items-center group py-0.5">
        {isEditingKey ? (
          <div className="flex items-center">
            <Input
              value={editKey}
              onChange={(e) => setEditKey(e.target.value)}
              className="h-6 text-sm w-24"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleKeySave()
                if (e.key === 'Escape') setIsEditingKey(false)
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 ml-1"
              onClick={handleKeySave}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsEditingKey(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <span className="font-medium text-blue-700">{key}:</span>
        )}
        
        {isEditing ? (
          <div className="flex items-center ml-2">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-6 text-sm w-48"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleValueSave()
                if (e.key === 'Escape') setIsEditing(false)
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 ml-1"
              onClick={handleValueSave}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsEditing(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            <span 
              className={`ml-2 ${getValueColor(type)} cursor-pointer hover:bg-gray-100 px-1 rounded`} 
              onClick={handleValueEdit}
              title="Click to edit"
            >
              {type === 'string' ? `"${value}"` : String(value)}
            </span>
            <span className="text-xs text-gray-400 ml-2">{type}</span>
          </>
        )}
        
        <div className="opacity-0 group-hover:opacity-100 flex ml-2">
          {!isEditing && !isEditingKey && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleValueEdit}
                title="Edit value"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
              {level > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleKeyEdit}
                  title="Edit key"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
              {level > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-500"
                  onClick={handleDelete}
                  title="Delete"
                >
                  <Minus className="h-3 w-3" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`${level > 0 ? 'mb-1' : 'mb-2'}`}>
      {renderValue(data, name)}
    </div>
  )
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data, onChange, name = 'root' }) => {
  const [localData, setLocalData] = useState(data)

  useEffect(() => {
    setLocalData(data)
  }, [data])

  const handleChange = (path: string[], newValue: any) => {
    const newData = JSON.parse(JSON.stringify(localData))
    let current = newData
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }
    
    if (path.length > 0) {
      current[path[path.length - 1]] = newValue
    } else {
      setLocalData(newValue)
      if (onChange) onChange(newValue)
      return
    }
    
    setLocalData(newData)
    if (onChange) onChange(newData)
  }

  const handleDelete = (path: string[]) => {
    const newData = JSON.parse(JSON.stringify(localData))
    let current = newData
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }
    
    if (Array.isArray(current)) {
      current.splice(parseInt(path[path.length - 1]), 1)
    } else {
      delete current[path[path.length - 1]]
    }
    
    setLocalData(newData)
    if (onChange) onChange(newData)
  }

  const handleAdd = (path: string[], key: string, value: any) => {
    const newData = JSON.parse(JSON.stringify(localData))
    let current = newData
    
    for (let i = 0; i < path.length; i++) {
      current = current[path[i]]
    }
    
    if (Array.isArray(current)) {
      current.push(value)
    } else {
      current[key] = value
    }
    
    setLocalData(newData)
    if (onChange) onChange(newData)
  }

  return (
    <div className="font-mono text-sm bg-white rounded-lg border p-4 max-h-96 overflow-auto">
      <JsonNode 
        data={localData} 
        name={name} 
        level={0} 
        path={[]}
        onChange={handleChange}
        onDelete={handleDelete}
        onAdd={handleAdd}
      />
    </div>
  )
}

export default JsonViewer 