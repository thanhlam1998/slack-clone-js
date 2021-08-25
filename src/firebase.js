import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBWKkfY99R-U8Fy13wefZee_ENneVcxS7w",
  authDomain: "calm-history-239107.firebaseapp.com",
  databaseURL: "https://calm-history-239107.firebaseio.com",
  projectId: "calm-history-239107",
  storageBucket: "calm-history-239107.appspot.com",
  messagingSenderId: "738810694114",
  appId: "1:738810694114:web:4aaeb0d94092c70c2051bb",
  measurementId: "G-EEZC7DVG0F",
};

firebase.initializeApp(firebaseConfig);
export default firebase;
