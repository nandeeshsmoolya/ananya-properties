const loginScreen = document.getElementById("login-screen");
const adminApp = document.getElementById("admin-app");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const loginStatus = document.getElementById("login-status");

function showAdmin(){ loginScreen.classList.add("hidden"); adminApp.classList.remove("hidden"); }
function showLogin(){ loginScreen.classList.remove("hidden"); adminApp.classList.add("hidden"); }

async function initAuth(){
  if (!window.ANANYA_FIREBASE?.ready) {
    showLogin();
    loginError.textContent = "Firebase is not configured yet. Add your Web App config first.";
    loginError.classList.remove("hidden");
    return;
  }
  const {auth, onAuthStateChanged} = window.ANANYA_FIREBASE;
  onAuthStateChanged(auth, user => {
    if (user) showAdmin(); else showLogin();
  });

  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const button = loginForm.querySelector("button[type=submit]");
    button.disabled = true; button.textContent = "Signing in...";
    loginError.classList.add("hidden");
    try {
      await window.ANANYA_FIREBASE.signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      loginError.textContent = "Login failed. Check the business email and password.";
      loginError.classList.remove("hidden");
    } finally {
      button.disabled = false; button.textContent = "Login";
    }
  });

  document.getElementById("logout").addEventListener("click", async () => {
    await window.ANANYA_FIREBASE.signOut(auth);
  });
}

window.addEventListener("ananya-firebase-ready", initAuth, {once:true});
if (window.ANANYA_FIREBASE) initAuth();
