// Firestore-backed lessons storage. Lessons are kept in a single document
// (collection "n4academy", doc "lessons") with an `items` array, which matches
// the app's "save the whole array at once" pattern and keeps writes atomic.
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Lesson } from "../types";

const LESSONS_DOC = { collection: "n4academy", id: "lessons" } as const;

export async function fetchLessonsFromFirestore(): Promise<Lesson[]> {
  if (!db) throw new Error("Firebase not configured");
  const ref = doc(db, LESSONS_DOC.collection, LESSONS_DOC.id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  const data = snap.data();
  return Array.isArray(data.items) ? (data.items as Lesson[]) : [];
}

export async function saveLessonsToFirestore(lessons: Lesson[]): Promise<void> {
  if (!db) throw new Error("Firebase not configured");
  const ref = doc(db, LESSONS_DOC.collection, LESSONS_DOC.id);
  await setDoc(ref, { items: lessons, updatedAt: Date.now() });
}
