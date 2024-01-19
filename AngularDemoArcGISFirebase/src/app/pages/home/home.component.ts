import {Component, OnDestroy, OnInit} from "@angular/core";
import {FormControl, FormGroupDirective, NgForm, Validators} from '@angular/forms';
import {ErrorStateMatcher} from '@angular/material/core';
import {AuthenticationService} from "../../services/database/AuthenticationService";
import {AngularFireDatabaseModule} from "@angular/fire/compat/database";
import {AngularFireAuth} from "@angular/fire/compat/auth";

@Component
({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})

export class HomeComponent implements OnInit, OnDestroy{


  get sign_up(): boolean {
    return this._sign_up;
  }

  set_sign_up(value: boolean) {
    this._sign_up = value;
  }
  get sign_in(): boolean {
    return this._sign_in;
  }

  set_sign_in(value: boolean) {
    this._sign_in = value;
  }

    private _sign_in = false;
    private _sign_up = false;
    constructor(
      private authenticationService:AuthenticationService
    ) {
    }
    email: string;
    password: string;
    go_back() {
      if (this.sign_up) {
        this.set_sign_up(false);
      } else if (this.sign_in) {
        this.set_sign_in(false);
      }
    }
    signUp() {
      console.log(this.email + this.password);
        this.authenticationService.SignUp(this.email, this.password);
        this.email = '';
        this.password = '';
    }

    signIn() {
      this.authenticationService.SignIn(this.email, this.password);
      this.email = '';
      this.password = '';
    }

    signOut() {
      this.authenticationService.SignOut();
    }


  ngOnDestroy(): void {
  }

  ngOnInit(): void {
  // this._authenticationService = new AuthenticationService()
  }
}
