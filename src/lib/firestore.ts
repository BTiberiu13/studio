
import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc, type DocumentReference, setDoc } from "firebase/firestore";
import type { SavedList, SavedListData, GeneratedItinerary, SavedItineraryData, Place } from "@/types";

const LISTS_COLLECTION = "lists";
const ITINERARIES_COLLECTION = "itineraries";
const PLACES_COLLECTION = "places";
const FIREBASE_NOT_CONFIGURED_ERROR = "Firebase is not configured. Please add your Firebase credentials to the .env file.";

// Export Place type for use in other files
export type { Place };

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

// Save a new itinerary
export async function saveItinerary(userId: string, name: string, itineraryData: GeneratedItinerary): Promise<DocumentReference> {
    if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
    const dataToSave = {
        name: name,
        ...JSON.parse(JSON.stringify(itineraryData)),
    };
    const itinerariesRef = collection(db, "users", userId, ITINERARIES_COLLECTION);
    return await addDoc(itinerariesRef, dataToSave);
}


// Get all saved itineraries for a user
export async function getSavedItineraries(userId: string): Promise<SavedItineraryData[]> {
    if (!db) {
        console.warn(FIREBASE_NOT_CONFIGURED_ERROR);
        return [];
    }
    const itinerariesRef = collection(db, "users", userId, ITINERARIES_COLLECTION);
    const querySnapshot = await getDocs(itinerariesRef);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name,
            dailyPlans: data.dailyPlans || [],
        };
    });
}

// Get a single saved itinerary
export async function getSavedItinerary(userId: string, itineraryId: string): Promise<SavedItineraryData | null> {
    if (!db) {
        console.warn(FIREBASE_NOT_CONFIGURED_ERROR);
        return null;
    }
    const itineraryRef = doc(db, "users", userId, ITINERARIES_COLLECTION, itineraryId);
    const docSnap = await getDoc(itineraryRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            name: data.name,
            dailyPlans: data.dailyPlans || [],
        };
    } else {
        return null;
    }
}

// Save a place with its details
export async function savePlace(placeData: Place) {
  if (!db) throw new Error(FIREBASE_NOT_CONFIGURED_ERROR);
  // Use placeId as the document ID to avoid duplicates
  const placeRef = doc(db, PLACES_COLLECTION, placeData.placeId);
  return await setDoc(placeRef, placeData, { merge: true }); // Use set with merge to create or update
}
