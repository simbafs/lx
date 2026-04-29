export const DEFAULT_HTML = `<div lx lx-left="0" lx-width="1920" lx-top="0" lx-height="1080">
  <div id="slide" lx-top="20" lx-left="20" lx-bottom="#footer.top-20" lx-aspect="16:9">slide</div>

  <div id="sidebar" lx lx-top="20" lx-bottom="#footer.top-20" lx-left="#slide.right+20" lx-right="-20">
    <div id="info" lx-top="0" lx-height="200/500" lx-left="0" lx-right="0">info</div>


    <div id="logo" lx-bottom="#qrcodes.top-20" lx-height="100" lx-left="0" lx-right="0">logo</div>


    <div id="qrcodes" lx lx-bottom="0" lx-height="250" lx-left="0" lx-right="0">
      <div id="hackmdqr" lx-left="0" lx-width="180" lx-bottom="0" lx-height="180">hackmd qrcode</div>

      <div id="slideqr" lx-right="0" lx-width="180" lx-bottom="0" lx-height="180">slide qrcode</div>
    </div>
  </div>

  <div id="footer" lx-bottom="-20" lx-height="200" lx-left="20" lx-right="-20">footer</div>
</div>`

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
