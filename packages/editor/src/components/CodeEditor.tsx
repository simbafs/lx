import Editor from '@monaco-editor/react'
import { useCallback } from 'react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function CodeEditor({ value, onChange }: CodeEditorProps) {
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
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    borderRight: '1px solid #333',
  },
  header: {
    padding: '8px 12px',
    background: '#1e1e1e',
    color: '#ccc',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottom: '1px solid #333',
  },
}
