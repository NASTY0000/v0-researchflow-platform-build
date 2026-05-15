import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

interface ResearchFlowDB extends DBSchema {
  profile: {
    key: string
    value: { id: string; data: Record<string, unknown>; updatedAt: number }
  }
  notifications: {
    key: string
    value: { id: string; data: Record<string, unknown>; createdAt: number }
    indexes: { 'by-created': number }
  }
  projects: {
    key: string
    value: { id: string; data: Record<string, unknown>; updatedAt: number }
  }
  ideas: {
    key: string
    value: { id: string; data: Record<string, unknown>; createdAt: number }
    indexes: { 'by-created': number }
  }
  messages: {
    key: string
    value: { id: string; projectId: string; data: Record<string, unknown>; createdAt: number }
    indexes: { 'by-project': string; 'by-created': number }
  }
  pendingActions: {
    key: string
    value: { id: string; type: string; payload: Record<string, unknown>; createdAt: number }
    indexes: { 'by-created': number }
  }
}

let dbInstance: IDBPDatabase<ResearchFlowDB> | null = null

export async function getDB(): Promise<IDBPDatabase<ResearchFlowDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<ResearchFlowDB>('researchflow-offline', 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('profile')) {
        database.createObjectStore('profile', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('notifications')) {
        const s = database.createObjectStore('notifications', { keyPath: 'id' })
        s.createIndex('by-created', 'createdAt')
      }
      if (!database.objectStoreNames.contains('projects')) {
        database.createObjectStore('projects', { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains('ideas')) {
        const s = database.createObjectStore('ideas', { keyPath: 'id' })
        s.createIndex('by-created', 'createdAt')
      }
      if (!database.objectStoreNames.contains('messages')) {
        const s = database.createObjectStore('messages', { keyPath: 'id' })
        s.createIndex('by-project', 'projectId')
        s.createIndex('by-created', 'createdAt')
      }
      if (!database.objectStoreNames.contains('pendingActions')) {
        const s = database.createObjectStore('pendingActions', { keyPath: 'id' })
        s.createIndex('by-created', 'createdAt')
      }
    },
  })

  return dbInstance
}

export async function saveProfile(id: string, data: Record<string, unknown>) {
  const db = await getDB()
  await db.put('profile', { id, data, updatedAt: Date.now() })
}

export async function loadProfile(id: string) {
  const db = await getDB()
  return db.get('profile', id)
}

export async function saveNotifications(notifications: Array<Record<string, unknown>>) {
  const db = await getDB()
  const tx = db.transaction('notifications', 'readwrite')
  for (const n of notifications) {
    await tx.store.put({ id: n.id as string, data: n, createdAt: Date.now() })
  }
  await tx.done

  // Trim to last 50
  const all = await db.getAllFromIndex('notifications', 'by-created')
  if (all.length > 50) {
    const trimTx = db.transaction('notifications', 'readwrite')
    for (const item of all.slice(0, all.length - 50)) await trimTx.store.delete(item.id)
    await trimTx.done
  }
}

export async function loadNotifications() {
  const db = await getDB()
  return db.getAllFromIndex('notifications', 'by-created')
}

export async function saveProjects(projects: Array<Record<string, unknown>>) {
  const db = await getDB()
  const tx = db.transaction('projects', 'readwrite')
  for (const p of projects) {
    await tx.store.put({ id: p.id as string, data: p, updatedAt: Date.now() })
  }
  await tx.done
}

export async function loadProjects() {
  const db = await getDB()
  return db.getAll('projects')
}

export async function saveIdeas(ideas: Array<Record<string, unknown>>) {
  const db = await getDB()
  const tx = db.transaction('ideas', 'readwrite')
  for (const idea of ideas) {
    await tx.store.put({ id: idea.id as string, data: idea, createdAt: Date.now() })
  }
  await tx.done

  // Trim to last 50
  const all = await db.getAllFromIndex('ideas', 'by-created')
  if (all.length > 50) {
    const trimTx = db.transaction('ideas', 'readwrite')
    for (const item of all.slice(0, all.length - 50)) await trimTx.store.delete(item.id)
    await trimTx.done
  }
}

export async function loadIdeas() {
  const db = await getDB()
  return db.getAllFromIndex('ideas', 'by-created')
}

export async function saveMessages(projectId: string, messages: Array<Record<string, unknown>>) {
  const db = await getDB()
  const tx = db.transaction('messages', 'readwrite')
  for (const msg of messages) {
    await tx.store.put({ id: msg.id as string, projectId, data: msg, createdAt: Date.now() })
  }
  await tx.done

  // Trim to last 100 per project
  const all = await db.getAllFromIndex('messages', 'by-project', projectId)
  if (all.length > 100) {
    const sorted = all.sort((a, b) => a.createdAt - b.createdAt)
    const trimTx = db.transaction('messages', 'readwrite')
    for (const item of sorted.slice(0, sorted.length - 100)) await trimTx.store.delete(item.id)
    await trimTx.done
  }
}

export async function loadMessages(projectId: string) {
  const db = await getDB()
  return db.getAllFromIndex('messages', 'by-project', projectId)
}

export async function queuePendingAction(type: string, payload: Record<string, unknown>): Promise<string> {
  const db = await getDB()
  const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`
  await db.put('pendingActions', { id, type, payload, createdAt: Date.now() })
  return id
}

export async function getPendingActions() {
  const db = await getDB()
  return db.getAllFromIndex('pendingActions', 'by-created')
}

export async function removePendingAction(id: string) {
  const db = await getDB()
  await db.delete('pendingActions', id)
}
