/**
 * serviceItems.js
 * User-defined servicing items.
 *
 * Servicing items are no longer a fixed, pre-defined catalogue. Every user builds
 * their own list (e.g. "Engine oil", "Chain lube", "Brake pads") which is stored in
 * Firestore at `users/{uid}/service_items/{itemId}` and shared by the web and Android apps.
 *
 * Item shape:
 *   { id: string, name: string, category: string, isEngineOil: boolean, createdAt: number, updatedAt: number }
 *
 * A service record stores the items it covered under `components`:
 *   components: { [itemId]: { done: true, price: number, name: string } }
 * The item name is copied into the record so history stays readable even if the item
 * is later renamed or removed.
 */

import { SERVICE_COMPONENTS } from './serviceComponents.js';

/** Legacy id used by records created before items became user-defined. */
export const LEGACY_ENGINE_OIL_ID = 'engine_oil';

const LEGACY_BY_ID = new Map(SERVICE_COMPONENTS.map(c => [c.id, c]));

export function slugifyItemName(name) {
  const base = String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return base || 'item';
}

/** Creates a new item object with a unique id that does not collide with `existing`. */
export function createServiceItem({ name, category = '', isEngineOil = false }, existing = []) {
  const now = Date.now();
  const taken = new Set(existing.map(i => i.id));
  let id = `item_${slugifyItemName(name)}`;
  if (taken.has(id)) id = `${id}_${now.toString(36)}`;
  return {
    id,
    name: String(name).trim(),
    category: String(category || '').trim(),
    isEngineOil: Boolean(isEngineOil),
    createdAt: now,
    updatedAt: now,
  };
}

/** True if this item is the one used for engine-oil change reminders. */
export function isEngineOilItem(item) {
  return Boolean(item && (item.isEngineOil || item.id === LEGACY_ENGINE_OIL_ID));
}

/** Ids of every item that counts as an engine-oil change (always includes the legacy id). */
export function getEngineOilItemIds(items = []) {
  const ids = new Set([LEGACY_ENGINE_OIL_ID]);
  items.forEach(i => { if (isEngineOilItem(i)) ids.add(i.id); });
  return Array.from(ids);
}

/** Best available display name for an item id. */
export function resolveItemName(id, items = [], componentData = null) {
  const item = items.find(i => i.id === id);
  if (item?.name) return item.name;
  if (componentData?.name) return componentData.name;
  const legacy = LEGACY_BY_ID.get(id);
  if (legacy) return legacy.name;
  const words = String(id).replace(/^item_/, '').replace(/_/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function resolveItemCategory(id, items = []) {
  const item = items.find(i => i.id === id);
  if (item) return item.category || '';
  return LEGACY_BY_ID.get(id)?.category || '';
}

/** Items done in a service record, as [{ id, name, price, category }]. */
export function getServicedItems(service, items = []) {
  if (!service?.components) return [];
  return Object.entries(service.components)
    .filter(([, data]) => data && data.done)
    .map(([id, data]) => ({
      id,
      name: resolveItemName(id, items, data),
      price: Number(data.price) || 0,
      category: resolveItemCategory(id, items),
    }));
}

/**
 * Non-destructive migration: returns new item objects for every item id that existing
 * service records reference (as done) but that is not yet in the user's item list.
 * Nothing is deleted or rewritten — existing records keep their data untouched.
 */
export function deriveMissingServiceItems(services = [], items = []) {
  const known = new Set(items.map(i => i.id));
  const missing = new Map();
  services.forEach(s => {
    Object.entries(s?.components || {}).forEach(([id, data]) => {
      if (!data || !data.done || known.has(id) || missing.has(id)) return;
      const legacy = LEGACY_BY_ID.get(id);
      const ts = Number(s.createdAt) || Date.now();
      missing.set(id, {
        id,
        name: data.name || legacy?.name || resolveItemName(id),
        category: legacy?.category || '',
        isEngineOil: id === LEGACY_ENGINE_OIL_ID || Boolean(legacy?.isEngineOil),
        createdAt: ts,
        updatedAt: Date.now(),
        migrated: true,
      });
    });
  });
  return Array.from(missing.values());
}

export function sortServiceItems(items = []) {
  return [...items].sort((a, b) => {
    if (isEngineOilItem(a) !== isEngineOilItem(b)) return isEngineOilItem(a) ? -1 : 1;
    return String(a.name).localeCompare(String(b.name), undefined, { sensitivity: 'base' });
  });
}

/**
 * Names the user has used before — their current items plus every item name found in
 * past service records (including records from before items became user-defined).
 * Returns [{ name, count, inList }] sorted by how often each was serviced.
 */
export function getItemNameSuggestions(services = [], items = []) {
  const byKey = new Map();
  const add = (name, inc, inList) => {
    const clean = String(name || '').trim();
    if (!clean) return;
    const key = clean.toLowerCase();
    const cur = byKey.get(key) || { name: clean, count: 0, inList: false };
    cur.count += inc;
    cur.inList = cur.inList || inList;
    byKey.set(key, cur);
  };
  items.forEach(i => add(i.name, 0, true));
  services.forEach(s => {
    Object.entries(s?.components || {}).forEach(([id, data]) => {
      if (data && data.done) add(resolveItemName(id, items, data), 1, false);
    });
  });
  return Array.from(byKey.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Filters suggestions for what the user is typing: prefix matches first, then word matches. */
export function filterItemSuggestions(suggestions = [], query = '', limit = 6) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return [];
  const scored = [];
  suggestions.forEach(s => {
    const n = s.name.toLowerCase();
    if (n === q) return;
    let score = -1;
    if (n.startsWith(q)) score = 0;
    else if (n.split(/[\s\-/&(]+/).some(w => w.startsWith(q))) score = 1;
    else if (q.length >= 3 && n.includes(q)) score = 2;
    if (score >= 0) scored.push({ ...s, score });
  });
  return scored.sort((a, b) => a.score - b.score || b.count - a.count).slice(0, limit);
}
