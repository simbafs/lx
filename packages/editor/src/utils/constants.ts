export const DEFAULT_HTML = `<!doctype html>
<html>
<head>
  <style>
    div {
      background-color: rgba(255, 180, 0, 0.08);
      border: 1px dashed rgba(0, 0, 0, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-family: sans-serif;
    }
  </style>
</head>
<body>
  <div id="container" lx lx-left="0" lx-top="0" lx-right="0" lx-bottom="0">
    <div id="header" lx lx-left="20" lx-top="20" lx-width="300" lx-height="60">
      Header
    </div>
    <div id="sidebar" lx lx-left="20" lx-top="previous.bottom+20" lx-width="150" lx-height="200">
      Sidebar
    </div>
    <div id="main" lx lx-left="previous.right+20" lx-top="20" lx-right="20" lx-bottom="100">
      Main Content
    </div>
    <div id="footer" lx lx-left="20" lx-right="20" lx-bottom="20" lx-height="60">
      Footer
    </div>
  </div>
</body>
</html>`

export const POSITION_RE = /^(body|#([A-Za-z_][\w\-:.]*))\.(left|right|top|bottom)([+-]\d+(?:\.\d+)?)?$/

export const RELATIVE_RE = /^(previous|next)\.(left|right|top|bottom)([+-]\d+(?:\.\d+)?)?$/

export const FIXED_SIZE_RE = /^-?\d+(?:\.\d+)?$/

export const RANGE_SIZE_RE = /^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/

export const ASPECT_RE = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/

export const LX_ATTRS = [
  'lx-left',
  'lx-right',
  'lx-top',
  'lx-bottom',
  'lx-width',
  'lx-height',
  'lx-aspect',
  'lx-l',
  'lx-r',
  'lx-t',
  'lx-b',
  'lx-w',
  'lx-h',
  'lx-a',
  'lx',
]

export const LX_ATTRS_LIST = [
  'lx-left',
  'lx-right',
  'lx-top',
  'lx-bottom',
  'lx-width',
  'lx-height',
  'lx-aspect',
]

export const ATTR_ALIAS: Record<string, string> = {
  'lx-l': 'lx-left',
  'lx-r': 'lx-right',
  'lx-t': 'lx-top',
  'lx-b': 'lx-bottom',
  'lx-w': 'lx-width',
  'lx-h': 'lx-height',
  'lx-a': 'lx-aspect',
}