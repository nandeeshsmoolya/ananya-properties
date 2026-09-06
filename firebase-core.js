// Loads Firebase as browser modules and exposes a small global API to the classic scripts.
(async () => {
  const ready = window.ANANYA_FIREBASE_READY;
  if (!ready) {
    window.ANANYA_FIREBASE = { ready:false, error:"Firebase config is incomplete." };
    window.dispatchEvent(new Event("ananya-firebase-ready"));
    return;
  }
  try {
    const v = "12.16.0";
    const [{ initializeApp }, authMod, fsMod] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${v}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${v}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${v}/firebase-firestore.js`)
    ]);
    const app = initializeApp(FIREBASE_CONFIG);
    const auth = authMod.getAuth(app);
    const db = fsMod.getFirestore(app);
    window.ANANYA_FIREBASE = {
      ready:true, app, auth, db,
      signInWithEmailAndPassword: authMod.signInWithEmailAndPassword,
      signOut: authMod.signOut,
      onAuthStateChanged: authMod.onAuthStateChanged,
      collection: fsMod.collection,
      doc: fsMod.doc,
      getDocs: fsMod.getDocs,
      getDoc: fsMod.getDoc,
      setDoc: fsMod.setDoc,
      deleteDoc: fsMod.deleteDoc,
      query: fsMod.query,
      where: fsMod.where,
      orderBy: fsMod.orderBy,
      updateDoc: fsMod.updateDoc,
      serverTimestamp: fsMod.serverTimestamp
    };
  } catch (error) {
    console.error(error);
    window.ANANYA_FIREBASE = { ready:false, error:error.message || "Firebase failed to load." };
  }
  window.dispatchEvent(new Event("ananya-firebase-ready"));
})();
