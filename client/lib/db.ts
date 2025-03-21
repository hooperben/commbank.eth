"use client"

// IndexedDB database for storing contacts
let db: IDBDatabase | null = null

export const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve()
      return
    }

    // Check if IndexedDB is supported
    if (!window.indexedDB) {
      reject(new Error("Your browser doesn't support IndexedDB"))
      return
    }

    const request = window.indexedDB.open("commbankDB", 1)

    request.onerror = (event) => {
      reject(new Error("Failed to open database"))
    }

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result
      resolve()
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Create an object store for contacts if it doesn't exist
      if (!database.objectStoreNames.contains("contacts")) {
        database.createObjectStore("contacts", { autoIncrement: true })
      }
    }
  })
}

export const addContact = (contact: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"))
      return
    }

    const transaction = db.transaction(["contacts"], "readwrite")
    const store = transaction.objectStore("contacts")
    const request = store.add(contact)

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject(new Error("Failed to add contact"))
    }
  })
}

export const getAllContacts = (): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"))
      return
    }

    const transaction = db.transaction(["contacts"], "readonly")
    const store = transaction.objectStore("contacts")
    const request = store.getAll()

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(new Error("Failed to get contacts"))
    }
  })
}

