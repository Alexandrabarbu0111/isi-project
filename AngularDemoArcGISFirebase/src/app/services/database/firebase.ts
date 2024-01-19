import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

export interface pharmachyItem {
    name: string,
    user: string,
    phName: string
}

@Injectable()
export class FirebaseService {

    listFeed: Observable<any[]>;
    objFeed: Observable<any>;

    constructor(public db: AngularFireDatabase) {

    }

    connectToDatabase() {
        this.listFeed = this.db.list('list').valueChanges();
        this.objFeed = this.db.object('obj').valueChanges();
    }

    getChangeFeedList() {
        return this.listFeed;
    }

    getChangeFeedObj() {
        return this.objFeed;
    }

    addPharmacyCardItem(user: string, phName: string) {
        let item: pharmachyItem = {
            name: "pharmacy card",
            user: user,
            phName: phName
        };
        this.db.list('list').push(item);
    }

    getPharmacyCardItems(user: string){
        //console.log("Ceva ", this.db.list('list').query.get());
        //return this.db.list('list').query;
        //console.log("ceva: ", this.db.list('list').valueChanges());
        console.log("listFeed: ", this.listFeed);
        console.log("objFeed: ", this.objFeed);
    }

    syncPointItem(user: string, phName: string) {
        let item: pharmachyItem = {
            name: "pharmacy card",
            user: user,
            phName: phName
        };
        this.db.object('obj').set([item]);
    }
}
