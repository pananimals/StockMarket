import { Injectable } from '@angular/core';
import { Http, Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import {AuthService} from './auth.service';
import { FlashMessagesService } from 'angular2-flash-messages';

@Injectable()
export class GetPricesService{

  currPrices: any;
  srvBlocked: boolean;
  Codes = ["FP", "FPL", "FPC", "PGB", "FPA", "DL24"];
  Units = [1, 100, 1, 50, 50, 100];
  timer = 3000;
  interval: any;
  lastDate: Date;
  dateTime: Date;
  displayLocal: String;

  constructor(
    private http: Http,
    private auth: AuthService,
    private flashMessage: FlashMessagesService
  ) {
    this.updatePrices();
    this.interval = setInterval(() => { 
      this.updatePrices(); 
    }, this.timer);
   }

   //checks if receive prices are new
  handleTime(newDate){
    if ( this.lastDate != newDate){ 
    //new prices      
      this.lastDate = newDate;
      this.dateTime = new Date(newDate);
      this.displayLocal =  this.dateTime.toLocaleString();
      return true;

    } else {
      //current prices are up to date
      return false;
    }
  }
    

  getPrices(){
    let headers = new Headers();
    headers.append('Content-Type','application/json');
    return this.http.get('stocks/current', {headers: headers})
      .map(res => res.json());
  }

  buyUnits(data){
    let headers = new Headers();
    headers.append('Content-Type','application/json');
    this.auth.getToken();
    headers.append('Authorization', this.auth.authToken);
    
    return this.http.post('stocks/buy', data, {headers: headers})
      .map(res => res.json());
  }

  sellUnits(data){
    let headers = new Headers();
    headers.append('Content-Type','application/json');
    this.auth.getToken();
    headers.append('Authorization', this.auth.authToken);

    return this.http.post('stocks/sell', data, {headers: headers})
      .map(res => res.json());
  }

  storePrices(prices){
    localStorage.setItem('prices', JSON.stringify(prices));
    this.currPrices = prices;
  }

  restorePrices(){
    if (!this.currPrices){  //if quick (logout -> login)-> empty local storage 
      this.currPrices = JSON.parse(localStorage.getItem('prices'));
    }
  }

  updatePrices(){
    this.getPrices()
      .subscribe(data =>{
        this.srvBlocked = data.srvBlocked;        
        if (!data.success) {  
          this.flashMessage.show(data.msg, 
            { cssClass: 'alert-danger', timeout: 5000 });

        }  else {
          if ( this.handleTime(data.current.publicationDate) )
          {
            this.storePrices(data.current);
          }
        }
      },
    (err) =>{
      // this.flashMessage.show("Our servers are currently under maintenace. Temporarily all transactions are suspended. Sorry for the inconvenience.", 
      // { cssClass: 'alert-danger', timeout: this.timer });
      console.log(err);
      this.srvBlocked = true;
    });
  }

}
