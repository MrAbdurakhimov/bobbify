import firebase from "firebase";
import "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/storage";


const config = {
  apiKey: "AIzaSyAkUAIjMMZkIWdnlzdmPI-8nU5tKvmx-BY",
  authDomain: "bobbify-messenger.firebaseapp.com",
  databaseURL: "https://bobbify-messenger.firebaseio.com",
  projectId: "bobbify-messenger",
  storageBucket: "bobbify-messenger.appspot.com",
  messagingSenderId: "417244468661",
  appId: "1:417244468661:web:f94a27667507214f3875fc"
};

firebase.initializeApp(config);

export default firebase;