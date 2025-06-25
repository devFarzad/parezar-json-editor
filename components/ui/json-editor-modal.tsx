'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface JsonEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (value: any, key?: string) => void
  currentValue: any
  currentKey: string
  valueType: string
  isEditingKey?: boolean
  title?: string
}

export const JsonEditorModal: React.FC<JsonEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentValue,
  currentKey,
  valueType,
  isEditingKey = false,
  title = 'Edit JSON Value'
}) => {
  const [value, setValue] = useState(() => {
    if (valueType === 'object' || valueType === 'array') {
      return JSON.stringify(currentValue, null, 2)
    }
    return String(currentValue)
  })
  
  const [key, setKey] = useState(currentKey)
  const [selectedType, setSelectedType] = useState(valueType)
  const [error, setError] = useState('')

  // Update state when props change (when modal opens with new values)
  useEffect(() => {
    if (isOpen) {
      if (valueType === 'object' || valueType === 'array') {
        setValue(JSON.stringify(currentValue, null, 2))
      } else {
        setValue(String(currentValue))
      }
      setKey(currentKey)
      setSelectedType(valueType)
      setError('')
    }
  }, [isOpen, currentValue, currentKey, valueType])

  const handleSave = () => {
    setError('')
    
    try {
      let parsedValue: any
      
      switch (selectedType) {
        case 'string':
          parsedValue = value
          break
        case 'number':
          parsedValue = Number(value)
          if (isNaN(parsedValue)) {
            setError('Invalid number format')
            return
          }
          break
        case 'boolean':
          parsedValue = value.toLowerCase() === 'true'
          break
        case 'null':
          parsedValue = null
          break
        case 'object':
        case 'array':
          try {
            parsedValue = JSON.parse(value)
            if (selectedType === 'array' && !Array.isArray(parsedValue)) {
              setError('Value must be a valid array')
              return
            }
            if (selectedType === 'object' && (Array.isArray(parsedValue) || typeof parsedValue !== 'object' || parsedValue === null)) {
              setError('Value must be a valid object')
              return
            }
          } catch {
            setError('Invalid JSON format')
            return
          }
          break
        default:
          parsedValue = value
      }
      
      onSave(parsedValue, isEditingKey ? key : undefined)
      onClose()
    } catch (err) {
      setError('Failed to parse value')
    }
  }

  const handleTypeChange = (newType: string) => {
    setSelectedType(newType)
    setError('')
    
    // Convert current value to new type
    try {
      switch (newType) {
        case 'string':
          setValue(String(currentValue))
          break
        case 'number':
          setValue(String(Number(currentValue) || 0))
          break
        case 'boolean':
          setValue('false')
          break
        case 'null':
          setValue('null')
          break
        case 'object':
          setValue('{}')
          break
        case 'array':
          setValue('[]')
          break
      }
    } catch {
      setValue('')
    }
  }

  const getInputComponent = () => {
    if (selectedType === 'object' || selectedType === 'array') {
      return (
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={selectedType === 'object' ? '{"key": "value"}' : '["item1", "item2"]'}
          className="font-mono text-sm min-h-[200px]"
          spellCheck={false}
        />
      )
    }

    if (selectedType === 'string' && value.length > 50) {
      return (
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter text value"
          className="min-h-[100px]"
          spellCheck={false}
        />
      )
    }

    if (selectedType === 'boolean') {
      return (
        <Select value={value} onValueChange={setValue}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">true</SelectItem>
            <SelectItem value="false">false</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    return (
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={selectedType === 'number' ? 'Enter number' : 'Enter value'}
        type={selectedType === 'number' ? 'number' : 'text'}
      />
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
            <Badge variant="secondary">{selectedType}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isEditingKey && (
            <div className="space-y-2">
              <Label htmlFor="key">Property Name</Label>
              <Input
                id="key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Property name"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="type">Data Type</Label>
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
                <SelectItem value="null">Null</SelectItem>
                <SelectItem value="object">Object</SelectItem>
                <SelectItem value="array">Array</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            {getInputComponent()}
            {selectedType === 'object' && (
              <p className="text-xs text-muted-foreground">
                Enter a valid JSON object, e.g., {"{"}"name": "John", "age": 30{"}"}
              </p>
            )}
            {selectedType === 'array' && (
              <p className="text-xs text-muted-foreground">
                Enter a valid JSON array, e.g., ["item1", "item2", 123]
              </p>
            )}
          </div>
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded border">
              {error}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 