import type { BookmarkFolderItem, BookmarkLinkItem, BookmarkItem } from './types'

type MappableKeys = keyof BookmarkFolderItem | keyof BookmarkLinkItem extends infer K
  ? K extends 'rawAttributes' | 'type' | 'parentId' | 'title'
  ? never
  : K & string
  : never;

interface AttributeConfig {
  htmlAttr: string;
  type: 'string' | 'boolean' | 'number' | 'array';
}

type GetPropType<T, K> = K extends keyof T ? T[K] : never;

type TypeStringMap<T> =
  NonNullable<T> extends string ? 'string' :
  NonNullable<T> extends number ? 'number' :
  NonNullable<T> extends boolean ? 'boolean' :
  NonNullable<T> extends unknown[] ? 'array' :
  'string';

type AttributeMap = {
  [K in MappableKeys]: {
    htmlAttr: string;
    type: TypeStringMap<
      GetPropType<BookmarkFolderItem, K> | GetPropType<BookmarkLinkItem, K>
    >;
  }
};

export const ATTRIBUTE_MAP: AttributeMap = {
  href: { htmlAttr: 'HREF', type: 'string' },
  addDate: { htmlAttr: 'ADD_DATE', type: 'number' },
  lastModified: { htmlAttr: 'LAST_MODIFIED', type: 'number' },
  icon: { htmlAttr: 'ICON', type: 'string' },
  tags: { htmlAttr: 'TAGS', type: 'array' },
  id: { htmlAttr: 'DATA-ID', type: 'string' },
  cover: { htmlAttr: 'DATA-COVER', type: 'string' },
  favorite: { htmlAttr: 'DATA-STAR', type: 'boolean' },
  description: { htmlAttr: 'DATA-DESC', type: 'string' },
  note: { htmlAttr: 'DATA-NOTE', type: 'string' },
  lastVisited: { htmlAttr: 'DATA-LAST-VISITED', type: 'number' },
  visitCount: { htmlAttr: 'DATA-VISIT-COUNT', type: 'number' },
  deletedAt: { htmlAttr: 'DATA-DELETED-AT', type: 'number' },
  expanded: { htmlAttr: 'DATA-EXPANDED', type: 'boolean' },
  sortBy: { htmlAttr: 'DATA-SORT-BY', type: 'string' },
  sortOrder: { htmlAttr: 'DATA-SORT-ORDER', type: 'string' },
}

export function itemToAttrString(item: BookmarkItem): string {
  const attributes: Record<string, string> = { ...(item.rawAttributes || {}) }
  const entries = Object.entries(ATTRIBUTE_MAP) as [MappableKeys, AttributeConfig][]

  for (const [key, config] of entries) {
    const value = item[key as keyof BookmarkItem]

    const isFalse = typeof value === 'boolean' && value === false
    const isStringEmpty = typeof value === 'string' && value.trim() === ''
    const isArrayEmpty = Array.isArray(value) && value.length === 0
    const isNullish = value === undefined || value === null

    const isEmpty = isNullish || isFalse || isStringEmpty || isArrayEmpty

    if (isEmpty && !(key in item)) {
      continue
    }
    if (isEmpty) {
      if (key === 'id') {
        attributes[config.htmlAttr] = crypto.randomUUID()
      } else if (key === 'addDate' || key === 'lastModified') {
        attributes[config.htmlAttr] = String(Date.now())
      } else {
        delete attributes[config.htmlAttr]
      }
      continue
    }

    let finalValue: string
    switch (config.type) {
      case 'boolean':
        finalValue = 'true'
        break
      case 'array':
        finalValue = Array.isArray(value) ? value.join(',') : ''
        break
      case 'number':
        finalValue = String(Number(value) || 0)
        break
      default:
        finalValue = String(value)
    }

    attributes[config.htmlAttr] = finalValue
  }

  return Object.entries(attributes)
    .map(([name, val]) => ` ${name}="${val}"`)
    .join('')
}

export function elementToItemData(el: HTMLElement, baseData: Partial<BookmarkItem>): BookmarkItem {
  const result: Record<string, unknown> = { ...baseData }
  const rawAttributes: Record<string, string> = {}

  if (el.attributes) {
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i]
      rawAttributes[attr.name.toUpperCase()] = attr.value
    }
  }
  result.rawAttributes = rawAttributes

  const entries = Object.entries(ATTRIBUTE_MAP) as [keyof BookmarkItem, AttributeConfig][]
  for (const [key, config] of entries) {
    const attrValue = typeof el.getAttribute === 'function' ? el.getAttribute(config.htmlAttr) : null

    if (attrValue === null) continue

    switch (config.type) {
      case 'number': {
        const num = Number(attrValue)
        if (!isNaN(num)) {
          result[key] = num
        } else {
          console.warn(`Expected number for attribute ${config.htmlAttr} but got "${attrValue}"`)

          if (key === 'addDate' || key === 'lastModified') {
            result[key] = Date.now()
          }
        }
        continue
      }
      case 'boolean':
        result[key] = attrValue === 'true'
        continue
      case 'array':
        result[key] = attrValue ? attrValue.split(',').map(t => t.trim()).filter(Boolean) : []
        continue
      default:
        result[key] = attrValue
    }
  }

  if (!result.id) {
    result.id = rawAttributes['DATA-ID'] || crypto.randomUUID()
  }

  return result as unknown as BookmarkItem
}