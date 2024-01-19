import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs";
import {AuthenticationService} from "./database/AuthenticationService";

export class AuthGuard implements CanActivate {

  constructor(private _authService: AuthenticationService, private _router: Router) {
  }
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (this._authService.isAuthenticated()) {
      return true;
    }
    // navigate to login page
    this._router.navigate(['/home']);
    // you can save redirect url so after authing we can move them back to the page they requested
    return false;
  }
}
