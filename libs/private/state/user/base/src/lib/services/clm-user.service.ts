import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AngularFireFunctions } from '@angular/fire/compat/functions';

import { SubSink } from 'subsink';

import { flatMap as __flatMap, find as __find, keys as __keys } from 'lodash';

import { AuthService } from '@ngfi/angular';

import { Organisation } from '@app/model/organisation';

import { OrganisationService } from '@app/private/state/organisation/main';

import { iTalUser } from '@app/model/user';
import { UserStore } from '@app/state/user';

@Injectable({
  providedIn: 'root',
})

/**
 * This service contains methods for managing and retrieving the users of an organisation
 */
export class CLMUsersService {
  private _sbS = new SubSink();

  org: Organisation;
  orgUsers: iTalUser[];

  constructor(private _dialog: MatDialog,
              private _bs: AngularFireFunctions,
              private _user$$: UserStore,
              private _orgsService: OrganisationService,
              private _authService: AuthService
  ) 
  {
    this.getOrg();
  }

  /**
   * Updates the details of the passed in user from the form group
   */
  updateUserDetails(user: iTalUser, userFormGroup: FormGroup) {
    user.roles  = user.roles as any;
    user.displayName = `${userFormGroup.value.firstName} ${userFormGroup.value.lastName}`;
    user.roles[this.org.id! as keyof typeof user.roles] = this.createUserRoles(__keys(user.roles[this.org.id! as keyof typeof user.roles]), userFormGroup.value.roles, true);
    this._user$$.updateUser(user).then(() => this._dialog.closeAll());
  }

  /**
   * Updates the username of the passed in user from the form group
   */
  updateUserName(user: iTalUser, userFormGroup: FormGroup) {
    user.displayName = `${userFormGroup.value.firstName} ${userFormGroup.value.lastName}`;
    this._user$$.updateUser(user).then(() => this._dialog.closeAll());
  }

  /**
   * Gets and sets the active organisation
   */
  getOrg() {
    this._sbS.sink = this._orgsService.getActiveOrg().subscribe((org) => {
      if (org?.id) {
        this.org = org;
        this.getAllOrgUsers(org.id);
      }
    });
  }

  /**
   * Gets all the users belonging to a particular organisation
   */
  getAllOrgUsers(org: string) {
    this._sbS.sink = this._orgsService.getOrgUsersDetails()
      .subscribe((users) => {
        this.orgUsers = users;
      });
  }

  /**
   * Gets the display names of all users from the user ids
   */
  getOrgUsers(userIds: string[]): string[] {
    if (this.orgUsers) {
      let users: any = this.orgUsers.filter((users) =>
        userIds.includes(users.id!)
      );
      users = __flatMap(users, 'displayName');
      return users;
    }
    return [];
  }

  /**
   * Resolves the user objects from the users array in the organisation
   */
  getOrgUsersProperties(userIds: string[]): iTalUser[] {
    if (this.orgUsers) {
      let users = this.orgUsers.filter((users) => userIds.includes(users.id!));
      return users;
    }
    return [];
  }

  /**
   * Gets the user object from the user id
   */
  getOrgUser(userId: string): iTalUser {
    return __find(this.orgUsers, { id: userId })!;
  }

  /**
   * Checks if the user is assigned the passed in role
   */
  isUserAssignedRole(role: string, roles: string[]): boolean {
    return roles.includes(role);
  }

  /**
   * Adds the user to the organisation from the form
   */
  addUserToOrg(userFormGroup: FormGroup) {
    let userData = userFormGroup.value;
    let user: iTalUser = {
      displayName: `${userData.firstName} ${userData.lastName}`,
      orgs: [this.org.id!],
      activeOrg: this.org.id!,
      profile: {
        phone: userData?.phone ?? '',
        email: userData?.email ?? '',
      },
      roles: {
        [this.org.id!] : this.createUserRoles(this.org.roles, userData.roles, false),
        access: true,
      },
      uid: '',
      email: userData.email,
    };    
    return this._bs.httpsCallable('createNewUser')(user)
  }

  /**
   * Initializes the user roles object
   */
  createUserRoles(orgRoles: string[], roles: string[], editingUser: boolean) {    
    let rolesObj: any = {};
    orgRoles.forEach((orgRole) => {
      rolesObj[orgRole] = roles.includes(orgRole) ? true : false;
    })

    if (!editingUser) {
      rolesObj['access'] = false;
      rolesObj['principal'] = false;
    }

    return rolesObj;
  }

  /**
   * Sets the user photo from the uploaded url
   */
  updateUserPhotoUrl(userData: iTalUser, fileUrl: string) {
    userData.photoUrl = fileUrl;
    this._user$$.updateUser(userData);
  }

  /**
   * Allows the user to update their password
   */
  updatePassword(email: string) {
    this._authService.resetPassword(email);
  }
}