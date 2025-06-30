
import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import type { SavedList, SavedListData } from "@/types";

const LISTS_COLLECTION = "lists";
const FIREBASE_NOT_CONFIGURED_ERROR = "Firebase is not configured. Please add your Firebase credentials to the .env file.";


// Get all saved lists for a user
export async function getSavedLists(userId: string): Promise<SavedListData[]> {
  if (!db) {
    console.warn(FIREBASE_NOT_CONFIGURED_ERROR);
    return [];
  }
  const listsRef = collection(db, "users", userId, LISTS_COLLECTION);
  const querySnapshot = await getDocs(listsRef);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name,
        itinerary: data.itinerary || [],
        searchResults: data.searchResults || [],
        timeframe: data.timeframe,
    }
  });
}

// Get a single saved list
export async function getSavedList(userId: string, listId: string): Promise<SavedListData | null> {
    if (!db) {
      console.warn(FIREBASE_NOT_CONFIGURED_ERROR);
      return null;
    }
    const listRef = doc(db, "users", userId, LISTS_COLLECTION, listId);
    const docSnap = await getDoc(listRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            name: data.name,
            itinerary: data.itinerary || [],
            searchResults: data.searchResults || [],
            timeframe: data.timeframe,
        };
    } else {
        return null;
    }
}


// Save a new list
export async function saveList(userId: string, listName: string, data: SavedList) {
  if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
  const listsRef = collection(db, "users", userId, LISTS_COLLECTION);
  return await addDoc(listsRef, { name: listName, ...data });
}

// Update an existing list
export async function updateList(userId: string, listId: string, listName: string, data: SavedList) {
  if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
  const listRef = doc(db, "users", userId, LISTS_COLLECTION, listId);
  return await updateDoc(listRef, { name: listName, ...data });
}

// Delete a list
export async function deleteList(userId: string, listId: string) {
  if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
  const listRef = doc(db, "users", userId, LISTS_COLLECTION, listId);
  return await deleteDoc(listRef);
}
