import Editor from '@monaco-editor/react'
import { useCallback, useRef, useImperativeHandle, forwardRef } from 'react'
import type { editor } from 'monaco-editor'
import { codeEditorStyles as styles } from '../styles'

export interface CodeEditorRef {
  setValue: (value: string) => void
  getValue: () => string
}

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
}

const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(function CodeEditor({ value, onChange }, ref) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  useImperativeHandle(ref, () => ({
    setValue: (newValue: string) => {
      if (editorRef.current) {
        editorRef.current.setValue(newValue)
      }
    },
    getValue: () => {
      return editorRef.current?.getValue() || value
    },
  }))

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      onChange(newValue || '')
    },
    [onChange],
  )

  return (
    <div style={styles.container}>
      <div style={styles.header}>HTML</div>
      <Editor
        height="100%"
        defaultLanguage="html"
        value={value}
        onChange={handleChange}
        onMount={(editor) => {
          editorRef.current = editor
        }}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
        }}
      />
    </div>
  )
})

export default CodeEditor