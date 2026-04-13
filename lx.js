/**
 * @file lx - HTML attribute DSL for absolute positioning
 * @version 1.0.0
 */

/**
 * @typedef {Object} RefExpr
 * @property {'ref'} type
 * @property {string} targetId
 * @property {'left'|'right'|'top'|'bottom'} edge
 * @property {number} offset
 */

/**
 * @typedef {Object} NumericValue
 * @property {'number'} type
 * @property {number} value
 */

/**
 * @typedef {RefExpr | NumericValue} Value
 */

/**
 * @typedef {Object} Constraint
 * @property {'left'|'right'|'top'|'bottom'} edge
 * @property {Value} value
 */

/**
 * @typedef {Object} ElementData
 * @property {string} id
 * @property {HTMLElement} el
 * @property {boolean} isContainer
 * @property {string|null} reference
 * @property {{left?:Constraint,right?:Constraint,top?:Constraint,bottom?:Constraint}} constraints
 * @property {{min:number,max:number}|number|undefined} width
 * @property {{min:number,max:number}|number|undefined} height
 * @property {{left?:number,right?:number,top?:number,bottom?:number,width?:number,height?:number}} resolved
 */

/**
 * @typedef {Object} LxError
 * @property {'MISSING_ID'|'CIRCULAR_DEPENDENCY'|'CONSTRAINT_TOO_MANY'|'CONSTRAINT_TOO_FEW'|'RANGE_INVALID'|'BOTH_RANGE'|'MIN_GREATER_MAX'|'SYNTAX_ERROR'} type
 * @property {string} [elementId]
 * @property {string} message
 */

/**
 * @typedef {Object} LxResult
 * @property {LxError[]} errors
 */

// ============================================================================
// Constants
// ============================================================================

const REF_EXPR_REGEX = /^#([^.]+)\.(left|right|top|bottom)([+-]\d+)?$/;

// ============================================================================
// Parser
// ============================================================================

/**
 * @param {string} val
 * @returns {Value}
 */
function parseValue(val) {
    const trimmed = val.trim();

    const match = trimmed.match(REF_EXPR_REGEX);
    if (match) {
        const [, targetId, edge, offsetStr] = match;
        const offset = offsetStr ? parseInt(offsetStr, 10) : 0;
        return {
            type: 'ref',
            targetId,
            edge,
            offset,
        };
    }

    const num = parseFloat(trimmed);
    if (!isNaN(num) && trimmed === String(num)) {
        return { type: 'number', value: num };
    }

    throw new Error(`Invalid syntax: "${val}"`);
}

/**
 * @param {Value} value
 * @param {function(string, string):number} getEdge
 * @returns {number}
 */
function resolveValue(value, getEdge) {
    if (value.type === 'number') {
        return value.value;
    }
    return getEdge(value.targetId, value.edge) + value.offset;
}

// ============================================================================
// Dependency Graph
// ============================================================================

class DependencyGraph {
    constructor() {
        /** @type {Map<string, Set<string>>} */
        this.edges = new Map();
        /** @type {Set<string>} */
        this.nodes = new Set();
    }

    /**
     * @param {string} id
     */
    addNode(id) {
        this.nodes.add(id);
        if (!this.edges.has(id)) {
            this.edges.set(id, new Set());
        }
    }

    /**
     * @param {string} from
     * @param {string} to
     */
    addEdge(from, to) {
        this.addNode(from);
        this.addNode(to);
        this.edges.get(from).add(to);
    }

    /**
     * @param {string} id
     * @returns {string[]}
     */
    getDependencies(id) {
        return Array.from(this.edges.get(id) || []);
    }

    /**
     * @returns {{from:string, to:string}|null}
     */
    detectCycles() {
        const visited = new Set();
        const recStack = new Set();
        const path = [];

        /** @param {string} node */
        const dfs = (node) => {
            visited.add(node);
            recStack.add(node);
            path.push(node);

            const deps = this.getDependencies(node);
            for (const dep of deps) {
                if (!visited.has(dep)) {
                    if (dfs(dep)) return true;
                } else if (recStack.has(dep)) {
                    path.push(dep);
                    return true;
                }
            }

            path.pop();
            recStack.delete(node);
            return false;
        };

        for (const node of this.nodes) {
            if (!visited.has(node)) {
                if (dfs(node)) {
                    return {
                        from: path[path.length - 1],
                        to: path[path.length - 2],
                    };
                }
            }
        }

        return null;
    }

    /**
     * @returns {string[]}
     */
    topologicalSort() {
        const visited = new Set();
        const result = [];

        /** @param {string} node */
        const dfs = (node) => {
            if (visited.has(node)) return;
            visited.add(node);
            const deps = this.getDependencies(node);
            for (const dep of deps) {
                dfs(dep);
            }
            result.push(node);
        };

        for (const node of this.nodes) {
            dfs(node);
        }

        return result;
    }
}

// ============================================================================
// Validation
// ============================================================================

/**
 * @param {ElementData} element
 * @param {Map<string, ElementData>} allElements
 * @returns {LxError|null}
 */
function validateConstraints(element, allElements) {
    const { constraints, width, height, id } = element;
    const horizCount = (constraints.left ? 1 : 0) + (constraints.right ? 1 : 0);
    const vertCount = (constraints.top ? 1 : 0) + (constraints.bottom ? 1 : 0);
    const hasWidth = width !== undefined;
    const hasHeight = height !== undefined;

    if (horizCount + (hasWidth ? 1 : 0) > 2) {
        return {
            type: 'CONSTRAINT_TOO_MANY',
            elementId: id,
            message: `Horizontal constraints exceed 2 (left, right, width)`,
        };
    }

    if (vertCount + (hasHeight ? 1 : 0) > 2) {
        return {
            type: 'CONSTRAINT_TOO_MANY',
            elementId: id,
            message: `Vertical constraints exceed 2 (top, bottom, height)`,
        };
    }

    if (horizCount + (hasWidth ? 1 : 0) < 2) {
        return {
            type: 'CONSTRAINT_TOO_FEW',
            elementId: id,
            message: `Horizontal constraints incomplete (need 2 of left, right, width)`,
        };
    }

    if (vertCount + (hasHeight ? 1 : 0) < 2) {
        return {
            type: 'CONSTRAINT_TOO_FEW',
            elementId: id,
            message: `Vertical constraints incomplete (need 2 of top, bottom, height)`,
        };
    }

    if (typeof width === 'object' && typeof height === 'object') {
        return {
            type: 'BOTH_RANGE',
            elementId: id,
            message: `Cannot use range for both width and height`,
        };
    }

    if (typeof width === 'object' && width.min > width.max) {
        return {
            type: 'MIN_GREATER_MAX',
            elementId: id,
            message: `Width min (${width.min}) > max (${width.max})`,
        };
    }

    if (typeof height === 'object' && height.min > height.max) {
        return {
            type: 'MIN_GREATER_MAX',
            elementId: id,
            message: `Height min (${height.min}) > max (${height.max})`,
        };
    }

    return null;
}

/**
 * @param {Map<string, ElementData>} elements
 * @returns {{graph:DependencyGraph, errors:LxError[]}}
 */
function buildDependencyGraph(elements) {
    const graph = new DependencyGraph();
    /** @type {LxError[]} */
    const errors = [];

    for (const [id, element] of elements) {
        graph.addNode(id);

        /**
         * @param {Value} value
         */
        const checkRef = (value) => {
            if (value.type === 'ref' && value.targetId) {
                if (!elements.has(value.targetId)) {
                    errors.push({
                        type: 'MISSING_ID',
                        elementId: id,
                        message: `Referenced element "${value.targetId}" does not exist`,
                    });
                } else {
                    graph.addEdge(id, value.targetId);
                }
            }
        };

        const { constraints, width, height } = element;
        if (constraints.left) checkRef(constraints.left.value);
        if (constraints.right) checkRef(constraints.right.value);
        if (constraints.top) checkRef(constraints.top.value);
        if (constraints.bottom) checkRef(constraints.bottom.value);
    }

    const cycle = graph.detectCycles();
    if (cycle) {
        errors.push({
            type: 'CIRCULAR_DEPENDENCY',
            elementId: cycle.from,
            message: `Circular dependency detected: ${cycle.from} -> ${cycle.to}`,
        });
    }

    return { graph, errors };
}

// ============================================================================
// Solver
// ============================================================================

/**
 * @param {Map<string, ElementData>} elements
 * @param {DependencyGraph} graph
 */
function solveConstraints(elements, graph) {
    const sortedIds = graph.topologicalSort();

    /**
     * @param {string} id
     * @param {string} edge
     * @returns {number}
     */
    const getEdge = (id, edge) => {
        const el = elements.get(id);
        if (!el) throw new Error(`Element ${id} not found`);
        return el.resolved[edge] ?? 0;
    };

    for (const id of sortedIds) {
        const element = elements.get(id);
        if (!element) continue;

        const { constraints, width, height } = element;
        const resolved = element.resolved;

        if (constraints.left) {
            resolved.left = resolveValue(constraints.left.value, getEdge);
        }
        if (constraints.right) {
            resolved.right = resolveValue(constraints.right.value, getEdge);
        }
        if (constraints.top) {
            resolved.top = resolveValue(constraints.top.value, getEdge);
        }
        if (constraints.bottom) {
            resolved.bottom = resolveValue(constraints.bottom.value, getEdge);
        }

        if (typeof width === 'number') {
            resolved.width = width;
        } else if (typeof width === 'object' && width) {
            resolved.width = width.max;
        }

        if (typeof height === 'number') {
            resolved.height = height;
        } else if (typeof height === 'object' && height) {
            resolved.height = height.max;
        }

        const hasLeft = resolved.left !== undefined;
        const hasRight = resolved.right !== undefined;
        const hasTop = resolved.top !== undefined;
        const hasBottom = resolved.bottom !== undefined;
        const hasWidth = resolved.width !== undefined;
        const hasHeight = resolved.height !== undefined;

        // Horizontal
        if (hasLeft && hasRight && hasWidth) {
            resolved.width = resolved.right - resolved.left;
        } else if (hasLeft && hasRight && !hasWidth) {
            resolved.width = resolved.right - resolved.left;
        } else if (hasLeft && hasWidth && !hasRight) {
            resolved.right = resolved.left + resolved.width;
        } else if (hasRight && hasWidth && !hasLeft) {
            resolved.left = resolved.right - resolved.width;
        }

        // Vertical
        if (hasTop && hasBottom && hasHeight) {
            resolved.height = resolved.bottom - resolved.top;
        } else if (hasTop && hasBottom && !hasHeight) {
            resolved.height = resolved.bottom - resolved.top;
        } else if (hasTop && hasHeight && !hasBottom) {
            resolved.bottom = resolved.top + resolved.height;
        } else if (hasBottom && hasHeight && !hasTop) {
            resolved.top = resolved.bottom - resolved.height;
        }
    }
}

/**
 * @param {ElementData} element
 * @param {HTMLElement} el
 */
function applyContentSize(element, el) {
    const { width, height, resolved } = element;

    if (typeof width === 'object' && width) {
        const contentWidth = el.scrollWidth;
        resolved.width = Math.min(Math.max(contentWidth, width.min), width.max);
    }

    if (typeof height === 'object' && height) {
        const contentHeight = el.scrollHeight;
        resolved.height = Math.min(Math.max(contentHeight, height.min), height.max);
    }

    if (resolved.left !== undefined && resolved.width !== undefined) {
        resolved.right = resolved.left + resolved.width;
    }
    if (resolved.top !== undefined && resolved.height !== undefined) {
        resolved.bottom = resolved.top + resolved.height;
    }
}

// ============================================================================
// CSS Generator
// ============================================================================

/**
 * @param {ElementData} element
 * @param {Map<string, ElementData>} elements
 * @returns {{left?:number,top?:number,width?:number,height?:number}}
 */
function generateCSS(element, elements) {
    const { resolved } = element;
    const result = {
        left: resolved.left,
        top: resolved.top,
        width: resolved.width,
        height: resolved.height,
    };

    if (element.reference) {
        const container = elements.get(element.reference);
        if (container && container.resolved) {
            if (result.left !== undefined && container.resolved.left !== undefined) {
                result.left = result.left - container.resolved.left;
            }
            if (result.top !== undefined && container.resolved.top !== undefined) {
                result.top = result.top - container.resolved.top;
            }
        }
    }

    return result;
}

/**
 * @param {HTMLElement} el
 * @param {{left?:number,top?:number,width?:number,height?:number}} css
 * @param {boolean} [isContainer]
 */
function applyCSS(el, css, isContainer) {
    el.style.position = isContainer ? 'relative' : 'absolute';

    if (css.left !== undefined) {
        el.style.left = `${css.left}px`;
    }
    if (css.top !== undefined) {
        el.style.top = `${css.top}px`;
    }
    if (css.width !== undefined) {
        el.style.width = `${css.width}px`;
    }
    if (css.height !== undefined) {
        el.style.height = `${css.height}px`;
    }
}


// ============================================================================
// Element Parser
// ============================================================================

const EDGE_PATTERN = /^lx-(left|right|top|bottom|l|r|t|b)$/;
const SIZE_PATTERN = /^lx-(width|height|w|h)$/;

const ALIAS_MAP = {
    l: 'left', r: 'right', t: 'top', b: 'bottom',
    w: 'width', h: 'height',
};

/**
 * @param {HTMLElement} el
 * @returns {ElementData|null}
 */
function parseElement(el) {
    const attrs = el.attributes;
    /** @type {ElementData['constraints']} */
    const constraints = {};
    /** @type {ElementData['width']} */
    let width;
    /** @type {ElementData['height']} */
    let height;
    let isContainer = false;
    let reference = null;

    for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        const name = attr.name;

        const edgeMatch = name.match(EDGE_PATTERN);
        if (edgeMatch) {
            const edge = ALIAS_MAP[edgeMatch[1]] || edgeMatch[1];
            constraints[edge] = {
                edge,
                value: parseValue(attr.value),
            };
            continue;
        }

        const sizeMatch = name.match(SIZE_PATTERN);
        if (sizeMatch) {
            const sizeName = ALIAS_MAP[sizeMatch[1]] || sizeMatch[1];
            const val = attr.value;

            if (val.includes('/')) {
                const [minStr, maxStr] = val.split('/');
                const min = parseFloat(minStr.trim());
                const max = parseFloat(maxStr.trim());
                if (sizeName === 'width') {
                    width = { min, max };
                } else {
                    height = { min, max };
                }
            } else {
                const num = parseFloat(val);
                if (!isNaN(num)) {
                    if (sizeName === 'width') {
                        width = num;
                    } else {
                        height = num;
                    }
                }
            }
            continue;
        }
    }

    const lxAttr = el.getAttribute('lx');
    if (lxAttr !== null) {
        if (lxAttr !== '') {
            reference = lxAttr;
        }
        isContainer = true;
    }

    const hasPosition = Object.keys(constraints).length > 0 || width !== undefined || height !== undefined;

    if (!hasPosition && !isContainer) {
        return null;
    }

    const id = el.id;
    if (!id && hasPosition) {
        return null;
    }

    return {
        id: id || '',
        el,
        isContainer,
        reference,
        constraints,
        width,
        height,
        resolved: {},
    };
}

/**
 * @param {HTMLElement} element
 * @returns {string|null}
 */
function findContainer(element) {
    let current = element.parentElement;

    while (current && current !== document.body) {
        if (current.hasAttribute('lx')) {
            if (current.id) {
                return current.id;
            }
        }
        current = current.parentElement;
    }

    return null;
}

/**
 * @param {HTMLElement} element
 * @returns {string|null}
 */
function findReference(element) {
    const lxAttr = element.getAttribute('lx');
    if (lxAttr !== null && lxAttr !== '') {
        if (lxAttr === 'body' || document.getElementById(lxAttr)) {
            return lxAttr;
        }
    }

    return findContainer(element);
}

// ============================================================================
// Main Runtime
// ============================================================================

/**
 * @param {ElementData} element
 * @param {Map<string, ElementData>} elements
 * @param {number} depth
 */
function printDebugElement(element, elements, depth = 0) {
    const indent = '  '.repeat(depth);
    const prefix = depth === 0 ? '├─' : '└─';
    const isContainer = element.isContainer;

    console.log(
        '%c%s %c#%s%c %s',
        'color: #888;', prefix,
        isContainer ? 'color: #9b59b6; font-weight: bold;' : 'color: #3498db; font-weight: bold;', element.id,
        'color: inherit;',
        isContainer ? '(container)' : ''
    );

    if (element.reference) {
        console.log('%s   %cref: %c#%s', ' '.repeat(depth * 2), 'color: #888;', 'color: #27ae60;', element.reference);
    }

    const constraints = element.constraints;
    const hasConstraints = constraints.left || constraints.right || constraints.top || constraints.bottom;

    if (hasConstraints) {
        const lines = [];
        if (constraints.left) lines.push(`left=${formatValue(constraints.left.value)}`);
        if (constraints.right) lines.push(`right=${formatValue(constraints.right.value)}`);
        if (constraints.top) lines.push(`top=${formatValue(constraints.top.value)}`);
        if (constraints.bottom) lines.push(`bottom=${formatValue(constraints.bottom.value)}`);
        console.log('%s   %c%s%c %s', ' '.repeat(depth * 2), 'color: #888;', '├─', 'color: inherit;', lines.join(', '));
    }

    if (element.width !== undefined || element.height !== undefined) {
        const sizeParts = [];
        if (element.width !== undefined) {
            sizeParts.push(`w=${formatSize(element.width)}`);
        }
        if (element.height !== undefined) {
            sizeParts.push(`h=${formatSize(element.height)}`);
        }
        console.log('%s   %c├─ size%c %s', ' '.repeat(depth * 2), 'color: #888;', 'color: inherit;', sizeParts.join(', '));
    }

    if (Object.keys(element.resolved).length > 0) {
        const resolved = element.resolved;
        const parts = [];
        if (resolved.left !== undefined) parts.push(`left:${resolved.left}`);
        if (resolved.top !== undefined) parts.push(`top:${resolved.top}`);
        if (resolved.width !== undefined) parts.push(`w:${resolved.width}`);
        if (resolved.height !== undefined) parts.push(`h:${resolved.height}`);
        console.log('%s   %c└─ resolved%c %s', ' '.repeat(depth * 2), 'color: #888;', 'color: #f39c12; font-weight: bold;', parts.join(', '));
    }

    for (const [, el] of elements) {
        if (el.el.parentElement === element.el) {
            printDebugElement(el, elements, depth + 1);
        }
    }
}

/**
 * @param {Value} value
 * @returns {string}
 */
function formatValue(value) {
    if (value.type === 'number') {
        return String(value.value);
    }
    return `#${value.targetId}.${value.edge}${value.offset >= 0 ? '+' : ''}${value.offset}`;
}

/**
 * @param {{min:number,max:number}|number|undefined} size
 * @returns {string}
 */
function formatSize(size) {
    if (size === undefined) return '';
    if (typeof size === 'number') return String(size);
    return `${size.min}/${size.max}`;
}

/**
 * Print debug info for all elements
 * @param {Map<string, ElementData>} elements
 */
function printDebug(elements) {
    console.log('%c\n[lx] Debug Info', 'color: #3498db; font-weight: bold; font-size: 16px;');

    const printed = new Set();

    for (const [, element] of elements) {
        if (printed.has(element.id)) continue;

        if (!element.el.parentElement || element.el.parentElement === document.body || element.el.parentElement === document.documentElement) {
            printDebugElement(element, elements, 0);
            printed.add(element.id);

            const printChildrenRecursively = (parentEl) => {
                for (const [, el] of elements) {
                    if (el.el.parentElement === parentEl && !printed.has(el.id)) {
                        const depth = getDepth(el, elements, 1);
                        printDebugElement(el, elements, depth);
                        printed.add(el.id);
                        printChildrenRecursively(el.el);
                    }
                }
            };
            printChildrenRecursively(element.el);
        }
    }
    console.log('');
}

/**
 * @param {ElementData} element
 * @param {Map<string, ElementData>} elements
 * @param {number} depth
 * @returns {number}
 */
function getDepth(element, elements, depth) {
    if (!element.el.parentElement || element.el.parentElement === document.body) {
        return depth - 1;
    }
    for (const [, el] of elements) {
        if (el.el === element.el.parentElement) {
            return getDepth(el, elements, depth + 1);
        }
    }
    return depth - 1;
}

/**
 * Initialize the lx layout engine
 * @param {HTMLElement} [root] - Root element to scan (defaults to document.body)
 * @param {{debug?: boolean}} [options]
 * @returns {LxResult}
 */
function init(root, options = {}) {
    root = root || document.body;

    /** @type {LxError[]} */
    const errors = [];
    /** @type {Map<string, ElementData>} */
    const elements = new Map();

    /**
     * @param {HTMLElement} node
     */
    const walk = (node) => {
        const parsed = parseElement(node);
        if (parsed && parsed.id) {
            if (elements.has(parsed.id)) {
                errors.push({
                    type: 'SYNTAX_ERROR',
                    elementId: parsed.id,
                    message: `Duplicate id: ${parsed.id}`,
                });
            } else {
                elements.set(parsed.id, parsed);
            }
        }

        for (const child of Array.from(node.children)) {
            walk(/** @type {HTMLElement} */(child));
        }
    };

    walk(root);

    if (options.debug) {
        printDebug(elements);
    }

    for (const [, element] of elements) {
        if (!element.reference) {
            element.reference = findReference(element.el);
        }
    }

    for (const [, element] of elements) {
        if (!element.reference || element.reference === 'body') continue;

        const container = elements.get(element.reference);
        if (!container) continue;

        const makeRelative = (edge) => {
            const constraint = element.constraints[edge];
            if (constraint && constraint.value.type === 'number') {
                constraint.value = {
                    type: 'ref',
                    targetId: element.reference,
                    edge,
                    offset: constraint.value.value,
                };
            }
        };

        makeRelative('left');
        makeRelative('right');
        makeRelative('top');
        makeRelative('bottom');
    }

    for (const [, element] of elements) {
        const error = validateConstraints(element, elements);
        if (error) {
            errors.push(error);
        }
    }

    const { graph, errors: graphErrors } = buildDependencyGraph(elements);
    errors.push(...graphErrors);

    if (errors.length > 0) {
        return { errors };
    }

    solveConstraints(elements, graph);

    for (const [, element] of elements) {
        if (element.width || element.height) {
            applyContentSize(element, element.el);
        }
    }

    for (const [, element] of elements) {
        const css = generateCSS(element, elements);
        applyCSS(element.el, css, element.isContainer);
    }

    return { errors };
}

// ============================================================================
// Auto-init
// ============================================================================

if (typeof window !== 'undefined' && window.document) {
    const isDebug = new URLSearchParams(window.location.search).has('lx-debug');
    const debugOptions = { debug: isDebug };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const result = init(undefined, debugOptions);
            if (result.errors.length > 0) {
                console.error('%c[lx]', 'color: #e74c3c; font-weight: bold;', 'Error');
                console.table(result.errors);
            }
        });
    } else {
        const result = init(undefined, debugOptions);
        if (result.errors.length > 0) {
            console.error('%c[lx]', 'color: #e74c3c; font-weight: bold;', 'Error');
            console.table(result.errors);
        }
    }
}

// ============================================================================
// Exports
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { init };
}

if (typeof window !== 'undefined') {
    window.lx = { init };
}
