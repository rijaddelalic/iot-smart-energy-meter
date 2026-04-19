import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "PROMIJENI_SA_TVOJIM_API_KEY",
    authDomain: "TVOJ_PROJEKT.firebaseapp.com",
    databaseURL: "https://TVOJ_PROJEKT-default-rtdb.firebaseio.com",
    projectId: "TVOJ_PROJEKT_ID",
    storageBucket: "TVOJ_PROJEKT.appspot.com",
    appId: "TVOJ_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);