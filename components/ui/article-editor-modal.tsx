'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from './textarea'

interface ArticleEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (updatedArticle: any) => void
  article: any
}

const isObject = (value: any) => typeof value === 'object' && value !== null && !Array.isArray(value)

const JsonFieldEditor: React.FC<{
  fieldKey: string
  fieldValue: any
  path: string[]
  onFieldChange: (path: string[], value: any) => void
  level: number
}> = ({ fieldKey, fieldValue, path, onFieldChange, level }) => {
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onFieldChange(path, e.target.value)
  }

  if (isObject(fieldValue)) {
    return (
      <div className="space-y-2 col-span-4" style={{ paddingLeft: level > 0 ? '1rem' : '0' }}>
        <Label className="font-semibold">{fieldKey}</Label>
        <div className="space-y-2 pl-4 border-l">
          {Object.entries(fieldValue).map(([key, value]) => (
            <JsonFieldEditor
              key={key}
              fieldKey={key}
              fieldValue={value}
              path={[...path, key]}
              onFieldChange={onFieldChange}
              level={level + 1}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 items-start gap-4 col-span-4">
      <Label htmlFor={path.join('-')} className="text-right pt-2">
        {fieldKey}
      </Label>
      <div className="col-span-3">
        {typeof fieldValue === 'string' && fieldValue.length > 60 ? (
          <Textarea
            id={path.join('-')}
            value={String(fieldValue)}
            onChange={handleValueChange}
            disabled={fieldKey === 'id'}
            rows={3}
          />
        ) : (
          <Input
            id={path.join('-')}
            value={String(fieldValue)}
            onChange={handleValueChange}
            disabled={fieldKey === 'id'}
          />
        )}
      </div>
    </div>
  )
}

export const ArticleEditorModal: React.FC<ArticleEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  article,
}) => {
  const [editedArticle, setEditedArticle] = React.useState(article)

  React.useEffect(() => {
    setEditedArticle(article)
  }, [article])

  if (!article) return null

  const handleFieldChange = (path: string[], value: any) => {
    setEditedArticle((prev: any) => {
      const newArticle = JSON.parse(JSON.stringify(prev))
      let current = newArticle
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]]
      }
      current[path[path.length - 1]] = value
      return newArticle
    })
  }

  const handleSave = () => {
    //
    const finalArticle = JSON.parse(JSON.stringify(editedArticle))
    
    const parseNumbers = (obj: any) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          parseNumbers(obj[key])
        } else if (key !== 'id' && typeof obj[key] === 'string' && !isNaN(Number(obj[key])) && obj[key].trim() !== '') {
           if (!isNaN(parseFloat(obj[key]))) {
             obj[key] = Number(obj[key])
           }
        }
      }
    }
    
    parseNumbers(finalArticle)
    onSave(finalArticle)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Article: {article.id}</DialogTitle>
          <DialogDescription>
            Modify the article content below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-4">
          <div className="space-y-4">
            {Object.entries(editedArticle).map(([key, value]) => (
              <JsonFieldEditor
                key={key}
                fieldKey={key}
                fieldValue={value}
                path={[key]}
                onFieldChange={handleFieldChange}
                level={0}
              />
            ))}
          </div>
        </ScrollArea>
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