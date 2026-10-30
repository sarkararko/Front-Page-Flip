/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Persistent IndexedDB Storage for Real PDF Binaries
const DB_NAME = 'fpf_pdf_filestore_v1';
const STORE_NAME = 'pdf_files';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported in this browser.'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const PdfFileStore = {
  async savePdfFile(pdfId: string, dataUrl: string, fileName?: string): Promise<void> {
    try {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ id: pdfId, dataUrl, fileName, updatedAt: Date.now() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Fallback to localStorage with a trimmed footprint if IndexedDB is disabled
      try {
        localStorage.setItem(`fpf_blob_${pdfId}`, dataUrl);
      } catch (err) {
        console.warn('Could not store PDF file to fallback storage:', err);
      }
    }
  },

  async getPdfFile(pdfId: string): Promise<string | null> {
    try {
      const db = await openDb();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(pdfId);
        req.onsuccess = () => {
          if (req.result && req.result.dataUrl) {
            resolve(req.result.dataUrl);
          } else {
            resolve(localStorage.getItem(`fpf_blob_${pdfId}`) || null);
          }
        };
        req.onerror = () => {
          resolve(localStorage.getItem(`fpf_blob_${pdfId}`) || null);
        };
      });
    } catch {
      return localStorage.getItem(`fpf_blob_${pdfId}`) || null;
    }
  },

  async deletePdfFile(pdfId: string): Promise<void> {
    try {
      const db = await openDb();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(pdfId);
        tx.oncomplete = () => {
          localStorage.removeItem(`fpf_blob_${pdfId}`);
          resolve();
        };
        tx.onerror = () => {
          localStorage.removeItem(`fpf_blob_${pdfId}`);
          resolve();
        };
      });
    } catch {
      localStorage.removeItem(`fpf_blob_${pdfId}`);
    }
  },
};
