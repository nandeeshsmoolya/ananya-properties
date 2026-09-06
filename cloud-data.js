function firebaseAvailable(){ return !!window.ANANYA_FIREBASE?.ready; }

async function cloudGetAllProperties(){
  if (!firebaseAvailable()) throw new Error(window.ANANYA_FIREBASE?.error || "Firebase is not configured.");
  const {db, collection, getDocs} = window.ANANYA_FIREBASE;
  const snap = await getDocs(collection(db, "properties"));
  return snap.docs.map(d => ({id:d.id, ...d.data()}));
}

async function cloudGetAvailableProperties(){
  if (!firebaseAvailable()) throw new Error(window.ANANYA_FIREBASE?.error || "Firebase is not configured.");
  const {db, collection, getDocs, query, where} = window.ANANYA_FIREBASE;
  const q = query(collection(db, "properties"), where("status", "==", "available"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({id:d.id, ...d.data()}));
}

async function cloudSaveProperty(item, isEdit){
  if (!firebaseAvailable()) throw new Error("Firebase is not configured.");
  const {db, doc, setDoc, serverTimestamp} = window.ANANYA_FIREBASE;
  const id = String(item.id || Date.now());
  const payload = {...item, id, updatedAt:serverTimestamp()};
  if (!isEdit) payload.createdAt = serverTimestamp();
  await setDoc(doc(db, "properties", id), payload, {merge:true});
  return id;
}

async function cloudDeleteProperty(id){
  if (!firebaseAvailable()) throw new Error("Firebase is not configured.");
  const {db, doc, deleteDoc} = window.ANANYA_FIREBASE;
  await deleteDoc(doc(db, "properties", String(id)));
}

async function cloudCreateEnquiry(item){
  if (!firebaseAvailable()) throw new Error("Firebase is not configured.");
  const {db, doc, setDoc, serverTimestamp} = window.ANANYA_FIREBASE;
  const id = `enq_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const payload = {
    ...item,
    id,
    status: "new",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(doc(db, "enquiries", id), payload);
  return id;
}

async function cloudGetEnquiries(){
  if (!firebaseAvailable()) throw new Error("Firebase is not configured.");
  const {db, collection, getDocs, query, orderBy} = window.ANANYA_FIREBASE;
  try {
    const q = query(collection(db, "enquiries"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({id:d.id, ...d.data()}));
  } catch (e) {
    // If an index is not available yet, load without ordering.
    const snap = await getDocs(collection(db, "enquiries"));
    return snap.docs.map(d => ({id:d.id, ...d.data()})).sort((a,b) => String(b.createdAt?.seconds||0).localeCompare(String(a.createdAt?.seconds||0)));
  }
}

async function cloudDeleteEnquiry(id){
  if (!firebaseAvailable()) throw new Error("Firebase is not configured.");
  const {db, doc, deleteDoc} = window.ANANYA_FIREBASE;
  await deleteDoc(doc(db, "enquiries", String(id)));
}

async function cloudUpdateEnquiryStatus(id, status){
  if (!firebaseAvailable()) throw new Error("Firebase is not configured.");
  const {db, doc, updateDoc, serverTimestamp} = window.ANANYA_FIREBASE;
  await updateDoc(doc(db, "enquiries", String(id)), {status, updatedAt:serverTimestamp()});
}
