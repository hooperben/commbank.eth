/**
 * IndexedDB implementation for commbank.eth
 * Stores notes, merkle tree leaves, encrypted payloads, and metadata
 */

import type { Note, TreeLeaf, Payload, Meta, Contact } from "@/_types";

const DB_NAME = "commbankdotethdb";
const DB_VERSION = 2;

// Store names
const NOTES_STORE = "notes";
const TREE_STORE = "tree";
const PAYLOAD_STORE = "payload";
const META_STORE = "meta";
const CONTACTS_STORE = "contacts";

/**
 * Check if IndexedDB is supported in the current browser
 */
export function isIndexedDBSupported(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return "indexedDB" in window && window.indexedDB !== null;
  } catch (_) {
    return false;
  }
}

/**
 * Initialize the database and create object stores
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBSupported()) {
      reject(new Error("IndexedDB is not supported in this browser"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event);
      reject(new Error("Failed to open database"));
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create Notes store
      if (!db.objectStoreNames.contains(NOTES_STORE)) {
        const notesStore = db.createObjectStore(NOTES_STORE, { keyPath: "id" });
        notesStore.createIndex("assetId", "assetId", { unique: false });
        notesStore.createIndex("isUsed", "isUsed", { unique: false });
        notesStore.createIndex("entity_id", "entity_id", { unique: false });
      }

      // Create Tree store
      if (!db.objectStoreNames.contains(TREE_STORE)) {
        const treeStore = db.createObjectStore(TREE_STORE, { keyPath: "id" });
        treeStore.createIndex("leafIndex", "leafIndex", { unique: false });
      }

      // Create Payload store
      if (!db.objectStoreNames.contains(PAYLOAD_STORE)) {
        db.createObjectStore(PAYLOAD_STORE, { keyPath: "id" });
      }

      // Create Meta store
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "id" });
      }

      // Create Contacts store
      if (!db.objectStoreNames.contains(CONTACTS_STORE)) {
        const contactsStore = db.createObjectStore(CONTACTS_STORE, {
          keyPath: "id",
        });
        contactsStore.createIndex("nickname", "nickname", { unique: false });
        contactsStore.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    // Initialize meta after database is ready
    request.onsuccess = () => {
      const database = request.result;

      try {
        // Check if meta exists, if not create it
        const transaction = database.transaction([META_STORE], "readwrite");
        const store = transaction.objectStore(META_STORE);
        const getRequest = store.get("meta");

        getRequest.onsuccess = () => {
          if (!getRequest.result) {
            // Meta doesn't exist, create it
            store.put({
              id: "meta",
              last_id: 0,
              encryptedMnemonic: "",
            });
          }
        };

        transaction.oncomplete = () => {
          resolve(database);
        };

        transaction.onerror = () => {
          resolve(database); // Still resolve even if meta init fails
        };
      } catch (error) {
        console.error("Error initializing meta:", error);
        resolve(database); // Still resolve database
      }
    };
  });
}

/**
 * Generic function to add/update an item in a store
 */
async function putItem<T>(storeName: string, item: T): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to put item in ${storeName}`));
    };
  });
}

/**
 * Generic function to get an item from a store by ID
 */
async function getItem<T>(storeName: string, id: string): Promise<T | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get item from ${storeName}`));
    };
  });
}

/**
 * Generic function to get all items from a store
 */
async function getAllItems<T>(storeName: string): Promise<T[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error(`Failed to get all items from ${storeName}`));
    };
  });
}

/**
 * Generic function to delete an item from a store
 */
async function deleteItem(storeName: string, id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to delete item from ${storeName}`));
    };
  });
}

/**
 * Generic function to clear a store
 */
async function clearStore(storeName: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error(`Failed to clear ${storeName}`));
    };
  });
}

// ===== Notes API =====

export async function addNote(note: Note): Promise<void> {
  return putItem(NOTES_STORE, note);
}

export async function getNote(id: string): Promise<Note | null> {
  return getItem<Note>(NOTES_STORE, id);
}

export async function getAllNotes(): Promise<Note[]> {
  return getAllItems<Note>(NOTES_STORE);
}

export async function getUnusedNotes(): Promise<Note[]> {
  const allNotes = await getAllNotes();
  return allNotes.filter((note) => !note.isUsed);
}

export async function updateNote(note: Note): Promise<void> {
  return putItem(NOTES_STORE, note);
}

export async function deleteNote(id: string): Promise<void> {
  return deleteItem(NOTES_STORE, id);
}

export async function clearNotes(): Promise<void> {
  return clearStore(NOTES_STORE);
}

// ===== Tree API =====

export async function addTreeLeaf(leaf: TreeLeaf): Promise<void> {
  return putItem(TREE_STORE, leaf);
}

export async function getTreeLeaf(id: string): Promise<TreeLeaf | null> {
  return getItem<TreeLeaf>(TREE_STORE, id);
}

export async function getAllTreeLeaves(): Promise<TreeLeaf[]> {
  return getAllItems<TreeLeaf>(TREE_STORE);
}

export async function deleteTreeLeaf(id: string): Promise<void> {
  return deleteItem(TREE_STORE, id);
}

export async function clearTree(): Promise<void> {
  return clearStore(TREE_STORE);
}

// ===== Payload API =====

export async function addPayload(payload: Payload): Promise<void> {
  return putItem(PAYLOAD_STORE, payload);
}

export async function getPayload(id: string): Promise<Payload | null> {
  return getItem<Payload>(PAYLOAD_STORE, id);
}

export async function getAllPayloads(): Promise<Payload[]> {
  return getAllItems<Payload>(PAYLOAD_STORE);
}

export async function deletePayload(id: string): Promise<void> {
  return deleteItem(PAYLOAD_STORE, id);
}

export async function clearPayloads(): Promise<void> {
  return clearStore(PAYLOAD_STORE);
}

// ===== Meta API =====

export async function getMeta(): Promise<Meta | null> {
  return getItem<Meta>(META_STORE, "meta");
}

export async function updateMeta(meta: Partial<Meta>): Promise<void> {
  const currentMeta = await getMeta();
  const updatedMeta: Meta = {
    id: "meta",
    encryptedMnemonic: meta.encryptedMnemonic ?? currentMeta?.encryptedMnemonic,
    last_id: meta.last_id ?? currentMeta?.last_id ?? 0,
  };
  return putItem(META_STORE, updatedMeta);
}

export async function incrementLastId(): Promise<number> {
  const meta = await getMeta();
  const newId = (meta?.last_id ?? 0) + 1;
  await updateMeta({ last_id: newId });
  return newId;
}

// ===== Utility functions =====

/**
 * Clear all data from the database
 */
export async function clearAllData(): Promise<void> {
  await Promise.all([clearNotes(), clearTree(), clearPayloads()]);

  // Reset meta
  await updateMeta({ last_id: 0 });
}

/**
 * Get database statistics
 */
export async function getDBStats(): Promise<{
  notes: number;
  unusedNotes: number;
  treeLeaves: number;
  payloads: number;
}> {
  const [notes, unusedNotes, treeLeaves, payloads] = await Promise.all([
    getAllNotes(),
    getUnusedNotes(),
    getAllTreeLeaves(),
    getAllPayloads(),
  ]);

  return {
    notes: notes.length,
    unusedNotes: unusedNotes.length,
    treeLeaves: treeLeaves.length,
    payloads: payloads.length,
  };
}

// ===== Contacts API =====
export async function addContact(contact: Contact): Promise<void> {
  return putItem(CONTACTS_STORE, contact);
}

export async function getContact(id: string): Promise<Contact | null> {
  return getItem<Contact>(CONTACTS_STORE, id);
}

export async function getAllContacts(): Promise<Contact[]> {
  return getAllItems<Contact>(CONTACTS_STORE);
}

export async function updateContact(contact: Contact): Promise<void> {
  return putItem(CONTACTS_STORE, contact);
}

export async function deleteContact(id: string): Promise<void> {
  return deleteItem(CONTACTS_STORE, id);
}

export async function clearContacts(): Promise<void> {
  return clearStore(CONTACTS_STORE);
}
