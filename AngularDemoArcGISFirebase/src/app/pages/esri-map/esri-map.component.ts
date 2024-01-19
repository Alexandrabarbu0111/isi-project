/*
  Copyright 2019 Esri
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnDestroy
} from "@angular/core";
//import Graphic from "@arcgis/core/Graphic.js";
import { MatSelectModule } from "@angular/material/select";
import { MatSelect } from "@angular/material/select";
import { setDefaultOptions, loadModules } from 'esri-loader';
import { Subscription } from "rxjs";
import { FirebaseService, pharmachyItem } from "src/app/services/database/firebase";
import { FirebaseMockService } from "src/app/services/database/firebase-mock";
import esri = __esri;
// import { ListPicker } from "tns-core-modules/ui/list-picker";
import { EventData } from "@angular/cdk/testing";
import { FormControl, Validators } from "@angular/forms";
import ClosestFacilityParameters = __esri.ClosestFacilityParameters;
import FeatureSet = __esri.FeatureSet;
import closestFacility = __esri.closestFacility;
import { AuthenticationService } from "../../services/database/AuthenticationService";
import { ConstantPool } from "@angular/compiler";
import { StringifyOptions } from "querystring";
import { async } from "@firebase/util";
import { animate, AnimationBuilder, style } from "@angular/animations";

//import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
//import * as locator from "esri/rest/locator";
//import * as Graphic from "esri/Graphic";
//import Graphic from '@arcgis/core/Graphic';

@Component({
  selector: "app-esri-map",
  templateUrl: "./esri-map.component.html",
  styleUrls: ["./esri-map.component.scss"]
})

export class EsriMapComponent implements OnInit, OnDestroy {
  toggleCards() {
    this.showCards = !this.showCards;
  }

  getPharmacies() {
    this.connectFirebase();

    const user = this.getEmail();
    const all_pharmacies = JSON.parse(sessionStorage.getItem("phItems"));
    const all_pharmacies_user = all_pharmacies.filter(pharmacy => pharmacy.user === user);
    const pharmacies_names = all_pharmacies_user.map(pharmacy => pharmacy.phName);
    //this.set_showCards(!this._showCards);
    //this.toggleCards();
    return pharmacies_names;
  }

  getSelectedName(pharmacy) {
    return this.pharmacy === pharmacy;
  }

  setPharmacy2(pharmacy) {
    this.pharmacy = pharmacy;
    this.initializeMap()

    //this.filterPharmacies(pharmacy);
  }

  setPharmacy(pharmacy) {
    this.phName = pharmacy;
    this.fbs.getPharmacyCardItems(this.getEmail());
  }
  getUsername() {
    return this.getEmail().split("@")[0];
  }
  getEmail() {
    return sessionStorage.getItem("email");
  }

  signOut() {
    this.authenticationService.SignOut();
  }

  get addCard(): boolean {
    return this._addCard;
  }

  set_addCard(value: boolean) {
    this._addCard = value;
  }

  // get showCards(): boolean {
  //   return this._showCards;
  // }

  // set_showCards(value: boolean) {
  //   this._showCards = value;
  // }
  // The <div> where we will place the map
  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;

  //FORMS CONTROL
  pharmaciesControl = new FormControl<string | null>(null, Validators.required);
  selectFormControl = new FormControl('', Validators.required);

  // register Dojo AMD dependencies
  _Map;
  _MapView;
  _FeatureLayer;
  _FeatureFilter;
  _Graphic;
  _GraphicsLayer;
  _Route;
  _RouteParameters;
  _FeatureSet;
  _Point;
  _locator;
  _SimpleMarkerSymbol;

  // Instances
  map: esri.Map;
  view: esri.MapView;
  pointGraphic: esri.Graphic;
  graphicsLayer: esri.GraphicsLayer;

  // Attributes
  zoom = 10;
  center: Array<number> = [26.1025, 44.4268];
  // basemap = "streets-vector";
  basemap = "arcgis-navigation";
  loaded = false;
  pointCoords: number[] = [-118.73682450024377, 34.07817583063242];
  dir: number = 0;
  count: number = 0;
  timeoutHandler = null;

  // firebase sync
  isConnected: boolean = false;
  subscriptionList: Subscription;
  subscriptionObj: Subscription;
  private _ServiceFeatureTable: any;
  private _Search: any;
  private _addCard: boolean = false;
  public showCards: boolean = false;
  private _Locate: any;
  //private user: string = "testuser@testdomain.com";
  public phName: string = "Sensiblu";
  public pharmacies: Array<string> = ["Catena", "Dr. Max", "Sensiblu", "HelpNet", "Farmacia Tei", "Dona"];
  public filteringCatena: boolean = false;
  public pharmacy: string = "";
  private startPoint: esri.Point;
  private endPoint: esri.Point;
  // public onSelectedIndexChanged(args: EventData) {
  //   const picker = <ListPicker>args.object;
  //   console.log(`index: ${picker.selectedIndex}; item" ${this.pharmacies[args.selectedIndex]}`);
  // }

  constructor(
    private fbs: FirebaseService,
    private authenticationService: AuthenticationService,
    private builder: AnimationBuilder
  ) { }

  async initializeMap() {
    try {
      // configure esri-loader to use version x from the ArcGIS CDN
      // setDefaultOptions({ version: '3.3.0', css: true });
      setDefaultOptions({ css: true });

      // Load the modules for the ArcGIS API for JavaScript
      const [esriConfig, Map, MapView, FeatureLayer, FeatureFilter, Graphic, Point, GraphicsLayer, route, RouteParameters, FeatureSet, Search, Locate, SimpleMarkerSymbol] = await loadModules([
        "esri/config",
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/FeatureLayer",
        "esri/layers/support/FeatureFilter",
        "esri/Graphic",
        "esri/geometry/Point",
        "esri/layers/GraphicsLayer",
        "esri/rest/route",
        "esri/rest/support/RouteParameters",
        "esri/rest/support/FeatureSet",
        "esri/widgets/Search",
        "esri/widgets/Locate",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/rest/locator"
      ]);

      esriConfig.apiKey = "AAPK1bb88f46c37241a6ab7f430fa38bb4ca9OtiXCfU6TSee9fisdi_vd5C5WhS53GMt4Hwge2yCupXeulC5JvnNrvsfne4eIMs";

      this._Map = Map;
      this._Search = Search;
      this._MapView = MapView;
      this._FeatureLayer = FeatureLayer;
      this._FeatureFilter = FeatureFilter;
      this._Graphic = Graphic;
      this._GraphicsLayer = GraphicsLayer;
      this._Route = route;
      this._RouteParameters = RouteParameters;
      this._FeatureSet = FeatureSet;
      this._Point = Point;
      this._Locate = Locate;
      this._SimpleMarkerSymbol = SimpleMarkerSymbol;

      //this.pharmacyGraphicsLayer = new GraphicsLayer();
      //this.map.add(this.pharmacyGraphicsLayer);

      // Configure the Map
      const mapProperties = {
        basemap: this.basemap
      };

      this.map = new Map(mapProperties);

      this.addFeatureLayers();
      this.addGraphicLayers();

      // this.addPoint(this.pointCoords[1], this.pointCoords[0], true);

      // Initialize the MapView
      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this.center,
        zoom: this.zoom,
        map: this.map
      };
      this.view = new MapView(mapViewProperties);

      //SEARCH
      const search = new Search({  //Add Search widget
        view: this.view
      });
      this.view.ui.add(search, "top-right");
      //END OF SEARCH

      if (this.filteringCatena) {
        console.log("Ok2");
        const CatenaQuery = {
          outFields: ["name"], // Attributes to return
          where: "name = 'Catena'"
          // returnGeometry: true
        };

        this.medicalFacilitiesLayer.queryFeatures(CatenaQuery)
          .then((results) => {

            console.log("Feature: " + results.features[0].toJSON());
            // this.view.map.removeAll();
            // this.view.graphics.removeAll();
            // Add features to graphics layer
            // const symbol = {
            //   type: "simple-fill",
            //   color: [ 20, 130, 200, 0.5 ],
            //   outline: {
            //     color: "white",
            //     width: .5
            //   },
            // };

            results.features.map((feature) => {
              // feature.symbol
              // feature.symbol = this._SimpleMarkerSymbol;
              const graphic = new Graphic({
                symbol: {
                  type: "simple-marker",
                  color: "green",
                  size: "40px"
                },
                geometry: feature.geometry
              });
              this.view.graphics.add(graphic);
              this.graphicsLayer.add(graphic);
              // feature.geometry
              // feature._Sim
              // feature.symbol = symbol;
              // feature.symbol =
              // feature.geometry = this._Point
              // feature.popupTemplate = popupTemplate;
              return feature;
            });
            // this.view.graphics.addMany(results.features);
            // this.view.map.add()
            // this.map.add(results.features);

          }).catch((error) => {
            console.log(error);
          });
      }

      //LOCATE
      const locate = new Locate({
        view: this.view,
        useHeadingEnabled: false,
        goToOverride: function (view, options) {
          options.target.scale = 1500;
          return view.goTo(options.target);
        }
      });
      this.view.ui.add(locate, "top-left");
      //END OF LOCATE

      const view = this.view
      //ROUTE ON CLICK
      const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
      this.view.on("double-click", function (event) {
        if (view.graphics.length === 0) {
          addGraphic("origin", event.mapPoint);

        } else if (view.graphics.length === 1) {
          addGraphic("destination", event.mapPoint);
          getRoute(); // Call the route service
        } else {
          view.graphics.removeAll();
          addGraphic("origin", event.mapPoint);
        }
      });

      //set Symbol
      this._SimpleMarkerSymbol = new SimpleMarkerSymbol({
        style: "square",
        color: "red"
      })

      function addGraphic(type, point) {
        const graphic = new Graphic({
          symbol: {
            type: "simple-marker",
            color: (type === "origin") ? "white" : "black",
            size: "8px"
          },
          geometry: point
        });
        view.graphics.add(graphic);
      }

      function getRoute() {
        let features = view.graphics.toArray().filter((feature: any) => feature.geometry.x);
        const routeParams = new RouteParameters({
          stops: new FeatureSet({ features: features }),
          returnDirections: false,
        });

        route
          .solve(routeUrl, routeParams)
          .then(function (data: { routeResults: any[] }) {
            data.routeResults.forEach(function (result: { route: any }) {
              const routeGeometry = result.route.geometry;

              // Creează marker-ul care se va deplasa pe traseu
              const movingPoint = createMovingPoint();

              // Deplasează marker-ul pe traseu și desenează traseul
              moveAlongRoute(routeGeometry, movingPoint, view);
            });
          })
          .catch(function (error: any) {
            console.log(error);
          });
      }
      function createMovingPoint() {
        const symbol = {
          type: "picture-marker",
          url: "data:image/png;base64,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",
          width: "50px",
          height: "50px"
        };

        const movingPoint = new Graphic({
          geometry: null,
          symbol: symbol,
        });

        return movingPoint;
      }

      function moveAlongRoute(routeGeometry: { paths: any; spatialReference: any; }, movingPoint: { geometry: { type: string; x: any; y: any; spatialReference: any; }; }, view: { graphics: { add: (arg0: any) => void; remove: (arg0: any) => void; }; }) {
        const lineSymbol = {
          type: "simple-line",
          color: [255, 0, 0],
          width: 3,
        };

        const routeGraphic = new Graphic({
          geometry: routeGeometry,
          symbol: lineSymbol,
        });

        view.graphics.add(routeGraphic);

        let pathIndex = 0;
        let pointIndex = 0;
        const routeCoordinates = routeGeometry.paths;

        function animateAlongRoute() {
          if (pathIndex < routeCoordinates.length) {
            const currentPath = routeCoordinates[pathIndex];

            if (pointIndex === 0 && pathIndex === 0) {
              const startPoint = {
                type: "point",
                x: currentPath[0][0],
                y: currentPath[0][1],
                spatialReference: routeGeometry.spatialReference,
              };
              movingPoint.geometry = startPoint;
              view.graphics.add(movingPoint);
            }

            const [x, y] = currentPath[pointIndex];
            const pathPoint = {
              type: "point",
              x: x,
              y: y,
              spatialReference: routeGeometry.spatialReference,
            };

            movingPoint.geometry = pathPoint;

            pointIndex++;

            if (pointIndex === currentPath.length) {
              pointIndex = 0;
              pathIndex++;
            }

            setTimeout(animateAlongRoute, 500);
          } else {
            view.graphics.remove(movingPoint);
          }
        }

        animateAlongRoute();

      }


      // Fires `pointer-move` event when user clicks on "Shift"
      // key and moves the pointer on the view.
      this.view.on('pointer-move', ["Shift"], (event) => {
        let point = this.view.toMap({ x: event.x, y: event.y });
        console.log("map moved: ", point.longitude, point.latitude);
      });

      await this.view.when(); // wait for map to load
      console.log("ArcGIS map loaded");
      console.log("Map center: " + this.view.center.latitude + ", " + this.view.center.longitude);
      return this.view;
    } catch (error) {
      console.log("EsriLoader: ", error);
    }
  }

  addGraphicLayers() {
    this.graphicsLayer = new this._GraphicsLayer();
    this.map.add(this.graphicsLayer);
  }
  public medicalFacilitiesLayer: __esri.FeatureLayer;

  addFeatureLayers() {
    // Trailheads feature layer (points)

    const popupPharmacy = {
      title: "Medical Center Information <br> Name:  {name}",
      content: "Amenity: {amenity} <br> Address: {addr_street} <br> Phone: {phone} <br> Opening hours: {opening_hours} <br>"
    }

    //Medical Centers

    this.medicalFacilitiesLayer = new this._FeatureLayer({
      url:
        "https://services-eu1.arcgis.com/zci5bUiJ8olAal7N/arcgis/rest/services/OSM_Medical_Facilities_EU/FeatureServer",
      //"https://iusb6ursosnpckyo.maps.arcgis.com/home/item.html?id=2471f9d914f5490fb23a0ae14b22a7e0",
      popupTemplate: popupPharmacy
    });
    console.log("ph: ", this.pharmacy);

    if (this.pharmacy !== "") {
      var filter = new this._FeatureFilter({ where: `name = '${this.pharmacy}'` });
      //var filter = new this._FeatureFilter({     where: "name = 'Dona'"  });
      this.medicalFacilitiesLayer.definitionExpression = filter.where;
    }

    // var filter = new this._FeatureFilter({where: `name = ${this.pharmacy}`});
    // this.medicalFacilitiesLayer.definitionExpression = filter.where;

    this.map.add(this.medicalFacilitiesLayer, 0);

    const popupPoligon = {
      title: "Hospital Information <br> Name: {name}",
      content: "<br> Amenity: {amenity} <br> Address: {addr_street} <br> Phone: {phone} <br> Opening hours: {opening_hours} <br>"
    }

    // Poligoane Farmacii
    var medicalAreasLayer: __esri.FeatureLayer = new this._FeatureLayer({
      url:
        "https://services-eu1.arcgis.com/zci5bUiJ8olAal7N/arcgis/rest/services/OSM_Medical_Areas_EU/FeatureServer",
      //"https://iusb6ursosnpckyo.maps.arcgis.com/home/item.html?id=2471f9d914f5490fb23a0ae14b22a7e0",
      popupTemplate: popupPoligon
    });

    this.map.add(medicalAreasLayer, 0);

    //this.pharmacyGraphicsLayer = new GraphicsLayer();
    //this.map.add(this.pharmacyGraphicsLayer, 0);
    console.log("feature layers added");
  }

  addPoint(lat: number, lng: number, register: boolean) {
    const point = { //Create a point
      type: "point",
      longitude: lng,
      latitude: lat
    };
    const simpleMarkerSymbol = {
      type: "simple-marker",
      color: [226, 119, 40],  // Orange
      outline: {
        color: [255, 255, 255], // White
        width: 1
      }
    };
    let pointGraphic: esri.Graphic = new this._Graphic({
      geometry: point,
      symbol: simpleMarkerSymbol
    });

    this.graphicsLayer.add(pointGraphic);
    if (register) {
      this.pointGraphic = pointGraphic;
    }
  }

  removePoint() {
    if (this.pointGraphic != null) {
      this.graphicsLayer.remove(this.pointGraphic);
    }
  }

  runTimer() {
    this.timeoutHandler = setTimeout(() => {
      // code to execute continuously until the view is closed
      // ...
      // this.animatePointDemo();
      this.runTimer();
    }, 200);
  }


  stopTimer() {
    if (this.timeoutHandler != null) {
      clearTimeout(this.timeoutHandler);
      this.timeoutHandler = null;
    }
  }

  connectFirebase() {
    if (this.isConnected) {
      return;
    }
    this.isConnected = true;
    this.fbs.connectToDatabase();
    this.subscriptionList = this.fbs.getChangeFeedList().subscribe((items: pharmachyItem[]) => {
      sessionStorage.setItem("phItems", JSON.stringify(items));

      console.log("got new items from list: ", items);
      this.graphicsLayer.removeAll();
      for (let item of items) {
  
      }
    });
    this.subscriptionObj = this.fbs.getChangeFeedObj().subscribe((stat: pharmachyItem[]) => {
      console.log("item updated from object: ", stat);
    });
  }

  addNewCard() {
    // console.log("Map center: " + this.view.center.latitude + ", " + this.view.center.longitude);
    //console.log("User: ", this.user, "PhName: ", this.phName);

    this.fbs.addPharmacyCardItem(sessionStorage.getItem("email"), this.phName);
    this._addCard = false;
  }

  disconnectFirebase() {
    if (this.subscriptionList != null) {
      this.subscriptionList.unsubscribe();
    }
    if (this.subscriptionObj != null) {
      this.subscriptionObj.unsubscribe();
    }
  }

  ngOnInit() {
    // Initialize MapView and return an instance of MapView
    console.log("initializing map");
    this.initializeMap().then(() => {
      // The map has been initialized
      console.log("mapView ready: ", this.view.ready);
      this.loaded = this.view.ready;
      this.runTimer();
    });
  }

  ngOnDestroy() {
    if (this.view) {
      // destroy the map view
      this.view.container = null;
    }
    this.stopTimer();
    // if (this.pharmacyGraphicsLayer) { 
    //   this.map.remove(this.pharmacyGraphicsLayer);
    // }
    this.disconnectFirebase();
  }

  selectCard() {

  }

  findClosestFacility() {
    //   this.
    // this.view.on("pointer-move", function (event) {
    // })
  }

  filterCatena() {
    this.filteringCatena = true;
    console.log(this.filteringCatena);
    this.initializeMap().then();
  }
  filterPharmacies(selectedPharmacyName) {
    // Apply a filter to the pharmacy layer based on the entered name    
    const expression = `UPPER(pharmacyName) LIKE UPPER('%${selectedPharmacyName}%')`;
    //this.mapView.map.layers.items[0].definitionExpression = expression;
    this._MapView.layers.items[0].definitionExpression = expression;
  }

}
