import { Injectable } from '@angular/core';
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { Observable } from 'rxjs';
import firebase from "firebase/compat";
import { Router } from '@angular/router';

@Injectable(
  {
    providedIn: 'root'
  }
)
 export class AuthenticationService {
   userData: Observable<firebase.User>;
   private static signedIn = false;
   constructor(private angularFireAuth: AngularFireAuth, private _router: Router) {
     this.userData = angularFireAuth.authState;
   }

   /* Sign up */
   SignUp(email: string, password: string) {
     this.angularFireAuth
       .createUserWithEmailAndPassword(email, password)
       .then(res => {
         alert('You are Successfully signed up!');
       })
       .catch(error => {
         alert('Something is wrong:' + error.message);
       });
   }

   /* Sign in */
   SignIn(email: string, password: string) {
    sessionStorage.setItem("email", email);
    
     this.angularFireAuth
       .signInWithEmailAndPassword(email, password)
       .then(res => {
         AuthenticationService.signedIn = true;
         alert("You're in!");
         this._router.navigate(['/map']);

       })
       .catch(err => {
         alert('Something went wrong:' + err.message);
       });
   }

   /* Sign out */
   SignOut() {
     this.angularFireAuth
       .signOut().then(res => {
          alert("You're out!");
          AuthenticationService.signedIn = false;
          this._router.navigate(['/home']);
     });
   }

  // isSignedIn() {
     // console.log(AuthenticationService.signedIn);
    // return this.userDat;
  // }
  isAuthenticated() {
    return !!this.angularFireAuth.currentUser;
  }

  getCurrentUser() {
    return this.angularFireAuth.currentUser;
  }

  getDisplayName() {
    return this.angularFireAuth.currentUser.then(user => {
      return user ? user.displayName : null;
    });
  }
}
