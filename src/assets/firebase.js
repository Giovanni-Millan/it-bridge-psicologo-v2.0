
  import { initializeApp } from "firebase/app";
  import { getAnalytics } from "firebase/analytics";
  import { getAuth } from "firebase/auth";


    const firebaseConfig = {
    apiKey: "AIzaSyCI_ytkawcwbp30WgL4VK5qlFcBW4Ga-4Q",
    authDomain: "bridge-psicologos.firebaseapp.com",
    projectId: "bridge-psicologos",
    storageBucket: "bridge-psicologos.firebasestorage.app",
    messagingSenderId: "1094172878941",
    appId: "1:1094172878941:web:dbf9a74514e4dff61b45b4"
    };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

  export const auth=getAuth(app);

  export default app;