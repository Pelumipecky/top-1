// ...existing code...
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../../database/firebaseConfig";

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res
      .status(200)
      .json({ message: "POST to this endpoint to create an admin user" });
  }

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    // avoid duplicate admin
    const usersCol = collection(db, "userlogs");
    const existingQuery = query(usersCol, where("admin", "==", true), where("name", "==", "admin"));
    const existingSnap = await getDocs(existingQuery);
    if (!existingSnap.empty) {
      const doc = existingSnap.docs[0];
      return res.status(200).json({ id: doc.id, existing: true });
    }

    const adminDoc = {
      name: "admin",
      password: "ChangeMe123!", // change this
      admin: true,
      email: "admin@example.com",
      idnum: 99999999,
      avatar: "avatar_1",
      balance: 0,
      date: new Date().toISOString().split("T")[0],
      bonus: 0,
      authStatus: "seen",
    };

    const ref = await addDoc(collection(db, "userlogs"), adminDoc);
    return res.status(200).json({ id: ref.id, existing: false });
  } catch (err) {
    console.error("create-admin error:", err);
    return res.status(500).json({ error: err.message });
  }
}
// ...existing code...