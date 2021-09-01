console.clear();
console.log();
console.log("starting");


//load modules
require("dotenv").config();
const nodemailer = require('nodemailer');
const binance1 = require("node-binance-api");
const http = require("http");
const https= require("https");
const express = require("express");
const bodyParser = require("body-parser");
const firebase=require("firebase")


//setup modules
//setup emails
const mailTransport=nodemailer.createTransport({
  service:"gmail",
  auth:{
    user: process.env.serverEmailAdress,
    pass: process.env.serverEmailPass
  }
})
//setup express website
const app = express();
const fs = require("fs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
const port=process.env.PORT;
var listener = app.listen(
  //8080,"192.168.1.23"
  port
  , () => {
  console.log("server listening on port "+port);
});
//setup binance
const api="https://api.binance.com/api/v3/";
const binance = new binance1().options({
  APIKEY: process.env.apiKey,
  APISECRET: process.env.secretKey
});
//setup jeanpaultrading database
const firebaseConfig = {
  apiKey: "AIzaSyAj4WTwR94oWQ525NTjRow2CRE_4WqC0ek",
  authDomain: "jeanpaultrading-c925a.firebaseapp.com",
  databaseURL: "https://jeanpaultrading-c925a.firebaseio.com",
  projectId: "jeanpaultrading-c925a",
  storageBucket: "jeanpaultrading-c925a.appspot.com",
  messagingSenderId: "591158833891",
  appId: "1:591158833891:web:e7a2fcdbd148ab9f180bd6"
};
var jeanpaultradingFB=firebase.initializeApp(firebaseConfig,"JeanPaulTrading");
const jeanpaultradingDB=jeanpaultradingFB.database();
//setup binancepricegather database
const firebaseConfig2 = {
  apiKey: "AIzaSyBhbmwknY0vA05-zUTqEZfgU0gGxFZxyhA",
  authDomain: "binancepricegather-2c3cf.firebaseapp.com",
  databaseURL: "https://binancepricegather-2c3cf.firebaseio.com",
  projectId: "binancepricegather-2c3cf",
  storageBucket: "binancepricegather-2c3cf.appspot.com",
  messagingSenderId: "958989627877",
  appId: "1:958989627877:web:de5a931fb2d359e09bbf0c"
};
var pricegatherFB=firebase.initializeApp(firebaseConfig2,"PriceGather");
const pricegatherDB=pricegatherFB.database();



//handy http requests
function httpGet(url,callback){
  http.get(url, (res)=>{
    var d = '';
    res.on('data', (c)=>{d+=c;});
    res.on('end', ()=>{callback(d);});
  });
}
function httpsGet(url,callback){
	https.get(url, (res) => {
    var d = '';
    res.on('data', (c)=>{d+=c})
    res.on('end', ()=>{callback(d)})
	});
}

app.get("/ping",(req,res)=>{res.send("ping")})
var pingIntervalID=setInterval(()=>{httpsGet(process.env.domain+"ping",console.log)},1500000)
app.get("/test/:n",(req,res)=>{
  res.send(req.params.n);
});



//random utility functions
//handy send email function
var EnableEmails=true; //if email feedback is sent
app.get("/ToggleEmails",(req,res)=>{
  EnableEmails=!EnableEmails;
  res.send("EnableEmails: "+(EnableEmails?"true":"false"))
})
function SendEmail(subject,txt){
  if(EnableEmails){
    mailTransport.sendMail({
      from: process.env.serverEmailAdress,
      to: process.env.myEmailAdress,
      subject: subject,
      text: txt
    },(err,info)=>{
      if(err){console.log("SendEmail/ error: ");console.log(err)}
      else{console.log("SendEmail/ successfull, response: "+info.response);}
    })
  }
}
//converts seconds value to closest smaller valid string interval value
//1m 3m 5m 15m 30m 1h 2h 4h 6h 8h 12h 1d 3d 1w 1M
function TtoString(t){
  var string="";
  if(Math.floor(t/2592000)>=1){return "1M"}
  else if(Math.floor(t/604800)>=1){ return "1w"}
  else if(Math.floor(t/259200)>=1){ return "3d"}
  else if(Math.floor(t/86400)>=1){ return "1d"}
  else if(Math.floor(t/43200)>=1){ return "12h"}
  else if(Math.floor(t/28800)>=1){ return "8h"}
  else if(Math.floor(t/21600)>=1){ return "6h"}
  else if(Math.floor(t/14400)>=1){ return "4h"}
  else if(Math.floor(t/7200)>=1){ return "2h"}
  else if(Math.floor(t/3600)>=1){ return "1h"}
  else if(Math.floor(t/1800)>=1){ return "30m"}
  else if(Math.floor(t/900)>=1){ return "15m"}
  else if(Math.floor(t/300)>=1){ return "5m"}
  else if(Math.floor(t/180)>=1){ return "3m"}
  else if(Math.floor(t/60)>=1){ return "1m"}
}

function FloorTo6(n){ return Math.floor(n*1000000)/1000000}
function RoundTo8(n){ return Math.round(n*100000000)/100000000}
function RoundTo3(n){ return Math.round(n*1000)/1000}
function FloorTo3(n){ return Math.floor(n*1000)/1000}
function FloorToN(n,m){
  var l=n
  for(var i=0; i<m; i++){ l*=10 }
  l=Math.floor(l)
  for(var i=0; i<m; i++){ l/=10 }
  return l
}




// GENERAL
// only the set currency is kept track of (capital and investment currencies)
// parameters of any other market related to the market or the account are ignored

//startup
setTimeout(()=>{

  ResetHistory()

  LoadAutosave()

},1000)
//shutdown
function Shutdown(){
  setTimeout(()=>{

    console.log("STARTING SHUTDOWN-----------");

    clearInterval(pingIntervalID)
    pingIntervalID=-1;

    if(ProgressOn){ ToggleProgress() }
    ResetHistory()

    for(var i=0; i<Players.length; i++){ if(Players[i].employed){Players[i].employed=false; break;}}
    PlayersActive=false;

    Me.S=[]; Me.dS=[];
    for(var i=0; i<231; i++){Me.S.push(0); Me.dS.push(0.00000001);}

    Market="blank"; CapMarket="blank"; InvestMarket="blank"; T=60;

    console.log("COMPLETED SHUTDOWN-----------");

  },1000)
}
app.get("/Shutdown",(req,res)=>{
  Shutdown()
  res.send("ok")
})
//client side
app.get("/CheckAdmin/:x",(req,res)=>{
  if(req.params.x==process.env.clientAdminPassword){
    console.log("Client/ checked in Admin");
    res.send("1")
  }
  else{
    console.log("Client/ checked in Guest");
    GuestActive=true; GuestActiveTrigger=true;
    setTimeout(CheckGuestActive,LiveT*1000)
    SendEmail("Guest checked in","a guest has checked in on the website, time: "+(new Date(Date.now())));
    res.send("0")
  }
})
var GuestActive=false; //if a guest is currently on the website
var GuestActiveTrigger=false;
function CheckGuestActive(){
  if(GuestActiveTrigger){
    GuestActiveTrigger=false;
    setTimeout(CheckGuestActive,LiveT*1000);
  }
  else{
    GuestActive=false;
  }
}
app.get("/GetGuestActive",(req,res)=>{
  res.send("GuestActive: "+GuestActive)
})





// FUTURES trading
var Fee=0.00042; //average fee rate for trades (i am assuming that half are taker and half are makers)
var Leverage=1;
app.get("/ChangeLeverage/:l",(req,res)=>{
  Leverage=parseInt(req.params.l)
  res.send("changed leverage: "+Leverage)
})
//when calculating max investment, scale the quantity by this factor to be sure not to ask too much
const MarketPriceK=0.94;
//price decimal precision for each market
const PricePrecision={
  BTCUSDT:2,
  ETHUSDT:2,
  BCHUSDT:2,
  XRPUSDT:4,
  EOSUSDT:3,
  LTCUSDT:2,
  IOTAUSDT:4,
  XMRUSDT:2,
  BNBUSDT:3,
}
const MinPriceStep={
  BTCUSDT:0.01,
  ETHUSDT:0.01,
  BCHUSDT:0.01,
  XRPUSDT:0.0001,
  EOSUSDT:0.001,
  LTCUSDT:0.01,
  IOTAUSDT:0.0001,
  XMRUSDT:0.01,
  BNBUSDT:0.001
}
const AmountPrecision={
  BTCUSDT:3,
  ETHUSDT:3,
  BCHUSDT:3,
  XRPUSDT:1,
  EOSUSDT:1,
  LTCUSDT:3,
  IOTAUSDT:1,
  XMRUSDT:3,
  BNBUSDT:2
}





//GENERAL
//markets kept track of
const Markets=["BTCUSDT","BCHUSDT","XMRUSDT","IOTAUSDT"]

const T=10
const Tstring="10s"
const HistoryDepth=40000 //total seconds depth of the historical arrays
const HistorySize=Math.ceil(HistoryDepth/T)

//historical price
//the current price in the historical arrays is at index Head
var Head=0;
var Price=[]; //array of price arrays for each market
var PriceLn=[];
var LastTime=-1; //timestamp of the most recent element

//returns the index value for a historical array, for a given index, i>=0
function I(i){
  return (i+Head<HistorySize?(i+Head):(i+Head-HistorySize));
}

//erase all historical arrays, including averages
function ResetHistory(){
  Head=0
  Markets.forEach((e,m)=>{
    Price[m]=[]
    PriceLn[m]=[]
    for(var i=0; i<AvrgsToUpdate.length; i++){
      Avrgs[m][AvrgsToUpdate[i].HalfWeight]=[]
    }
    for(var i=0; i<HistorySize; i++){
      Price[m][i]=1
      PriceLn[m][i]=0
      for(var j=0; j<AvrgsToUpdate.length; j++){
        Avrgs[m][AvrgsToUpdate[j].HalfWeight][i]=0
      }
    }
  })
}

var FindHistoryFailed=0
//fill to capacity the historical arrays from scratch from the binancepricegather database
//needs to complete in under T time, because after T time starts the Live interval that messes things up
function FindHistory(){
  console.log("FindHistory/ starting, targetsize: "+HistorySize);
  ResetHistory()

  var endtime=Math.ceil(Date.now()/(T*1000))*T*1000 //theoretical timestamp of the most recent element in each market
  var starttime=endtime-HistorySize*T*1000-3600000 //search up to this timestamp, a bit smaller then really needed
  var marketendtime=[] //timestamp of most recent database element for each market
  var smallestendtime=Date.now()+100000000

  var timeinstances=[]
  pricegatherDB.ref("TimeInstances").once("value",async function (res){
    var a=res.val()
    for(var k in a){
      timeinstances.push(a[k])
    }
    timeinstances.sort((x,y)=>{return (parseInt(y)-parseInt(x))})

    for(var m=0; m<Markets.length; m++){
      Price[m]=[]
      PriceLn[m]=[]

      var lasttime=timeinstances[0]
      var lastprice=1

      var i=0; var go=true;
      //scroll through packages until history is filled
      while(go){
        var b=await (new Promise((resolve,reject)=>{ pricegatherDB.ref(Markets[m]+"/"+timeinstances[i]).once("value",(res2)=>{ resolve(res2.val()) }) }))
        if(i==0){
          marketendtime[m]=timeinstances[0]+(b.length-2)*T*1000
          if(marketendtime[m]<smallestendtime){ smallestendtime=marketendtime[m] }
        }

        //if time gap is present, connect the two packages
        for(var j=1; lasttime-timeinstances[i]-(b.length-2)*T*1000>j*T*1000; j++){
          Price[m].push(lastprice+(b[b.length-1]-lastprice)*(j*T*1000)/(lasttime-timeinstances[i]-(b.length-2)*T*1000))
          PriceLn[m].push(Math.log(lastprice+(b[b.length-1]-lastprice)*(j*T*1000)/(lasttime-timeinstances[i]-(b.length-2)*T*1000)))
        }

        lasttime=timeinstances[i]

        for(var j=b.length-1; j>0; j--){
          if(lasttime+j*T*1000<starttime){
            Go=false
            j=-1
          }
          else{
            Price[m].push(b[j])
            PriceLn[m].push(Math.log(b[j]))
          }
        }
        lastprice=b[1]
        i++
        if(i>=timeinstances.length){
          go=false
        }
      }

      console.log("FindHistory/ recorded "+Markets[m]+", size: "+Price[m].length);

      while(Price[m].length<HistorySize){
        Price[m].push(1)
        PriceLn[m].push(0)
      }
      while(marketendtime[m]>smallestendtime){
        Price[m].shift()
        PriceLn[m].shift()
        marketendtime[m]-=T*1000
      }
    }
    for(var m=0; m<Markets.length; m++){
      Price[m].splice(HistorySize,Price[m].length-HistorySize)
      PriceLn[m].splice(HistorySize,PriceLn[m].length-HistorySize)

      LivePrice[m]=Price[m][Head]
      LivePriceLn[m]=PriceLn[m][Head]
      AvrgsToUpdate.forEach((p,t)=>{
        Avrgs[m][p.HalfWeight]=CalcAvrg(m,p)
        LiveAvrgs[m][p.HalfWeight]=Avrgs[m][p.HalfWeight][Head]
      })
    }

    console.log("FindHistory/ finished");

    //sometimes, the last markets result compèletely null and ca. double in size
    //cant fix it now, just redo findhistory...
    var failed=false
    for(var m=0; m<Markets.length; m++){
      if(!failed && Price[m][HistorySize-1]==null){ failed=true }
      else{
        for(var i=HistorySize-2; i>-1; i--){
          if(Price[m][i]==null){ Price[m][i]=Price[m][i+1] }
        }
      }
    }
    if(failed && FindHistoryFailed<4){
      console.log("FindHistory/ failed, some prices are null, toggling progress...")
      if(FindHistoryFailed==0){ SendEmail("FindHistoryFailed","FindHistoryFailed") }
      FindHistoryFailed++
      ToggleProgress()
      ToggleProgress()
    }
  })
}





//arrays of Averages, indexed by market by their HalfWeght,
//  containing their historical average array directly correlated with the historical price, [market][weight][time]
//(averages of PriceLn not Price)
//only necessary Avrgs are stored and kept track of, if another Avrg is requested
//  but content is null, means that it is not present and needs to be calculated from scratch
var Avrgs=[]
Markets.forEach((e,m)=>{Avrgs[m]=[]})
//array of the AvrgParameters of the Avrgs that need to be updated with the current moving price
var AvrgsToUpdate=[]
//Create tha avrg parameters object and add it to AvrgsToUpdate
function PushAverage(w){
  var p={
    HalfWeight:w, //element index with halved weight, actually everything labeled halfweight refers to the 1/10 weight
    A:Math.pow(0.1,1/w), //base of the exponential function
    depth:w, //how many elements to scan
    Atable:[], //table of evera power of A needed
    Asum:0, //sum of Atable

    LiveAtable:[], //Atable for the constants that multiply LivePrice in LiveAvrgs, indexed with their LiveTime
  }
  for(var i=0; i<p.depth; i++){
    p.Atable[i]=Math.pow(p.A,i)
    p.Asum+=p.Atable[i]
  }
  for(var i=0; i<T; i+=LiveT){ p.LiveAtable[i]=i/T*Math.pow(p.A,-i/T) }

  console.log("PushAverage/ pushing average, w: "+p.HalfWeight+", A: "+p.A.toFixed(4)+", depth: "+p.depth+", Asum: "+p.Asum.toFixed(4));
  AvrgsToUpdate.push(p)
  Markets.forEach((e,m)=>{
    Avrgs[m][w]=CalcAvrg(m,p)
    LiveAvrgs[m][w]=Avrgs[m][w][I(0)]
  })
}
//given a halfweight, remove its avrg parameters object from AvrgsToUpdate
//and delete its avrgs
function UnloadAverage(w){
  for(var i=0; i<AvrgsToUpdate.length; i++){
    if(AvrgsToUpdate[i].HalfWeight==w){
      AvrgsToUpdate.splice(i,1)
      i=999
    }
  }
  Markets.forEach((e,m)=>{
    Avrgs[m][w]=null
    LiveAvrgs[m][w]=null
  })
  console.log("UnloadAverage/ unloaded average w: "+w+", AvrgsToUpdate: "+AvrgsToUpdate.length);
}
//from the current PriceLn array, calculate the average given the parameters object and the market
//automatically manages the Head index stuff
function CalcAvrg(m,p){
  var a=[]

  a[I(HistorySize-1)]=PriceLn[m][I(HistorySize-1)]

  for(var i=HistorySize-2; i>-1; i--){
    if(i%100!=0){
      a[I(i)]= ( (a[I(i+1)]*p.Asum - PriceLn[m][I(Math.min(HistorySize-1,i+p.depth))]*p.Atable[p.depth-1])*p.A + PriceLn[m][I(i)] )/p.Asum
    }else{
      a[I(i)]=0
      for(var j=0; j<p.depth; j++){
        a[I(i)]+=PriceLn[m][I(Math.min(i+j,HistorySize-1))]*p.Atable[j]
      }
      a[I(i)]/=p.Asum
    }
  }

  console.log("CalcAvrg/ calculated avrg, m: "+m+", w: "+p.HalfWeight);
  return a
}





// the history is not translated immediatly, average prices are requested much
//  faster than T to improve accuracy
// when the history T period passes, the last Live price received is used
//  to unshift the history array
// but in the meantime the tradeAI watches new live price, to react as
//  fast as possible to market changes
var LivePrice=[]
var LivePriceLn=[]
Markets.forEach((e,i)=>{ LivePrice[i]=1; LivePriceLn[i]=0; })
var LiveT=2 //fast update period, has to be a factor of T
var LiveTime=0 //time from the last history price and the current live price, <T
var LiveIntervalID=-1
//avrgs value of live price by market by halfweight
var LiveAvrgs=[]
Markets.forEach((e,i)=>{ LiveAvrgs[i]=[] })
//Live timer function, request current price and update Live variables
async function LiveNext(){
  Stats.LivePrice++;
  ServerTime+=LiveT*1000;
  LiveTime+=LiveT;

  if(LiveTime<T){
    for(var m=0; m<Markets.length; m++){
      var res=await (new Promise((resolve,reject)=>{ binance.futuresMarkPrice(Markets[m]).then(resolve) }))

      if(res.markPrice==undefined){
        console.log(res);
      }else{
        LivePrice[m]=parseFloat(res.markPrice)
        LivePriceLn[m]=Math.log(LivePrice[m])
      }
      if(LivePrice[m]==null){
        LivePrice[m]=Price[m][Head]
        LivePriceLn[m]=Math.log(LivePrice[m])
      }

      AvrgsToUpdate.forEach((p,t)=>{
        LiveAvrgs[m][p.HalfWeight]=
          (Avrgs[m][p.HalfWeight][Head]*p.Asum+LivePriceLn[m]*p.LiveAtable[LiveTime])
          /(p.Asum+p.LiveAtable[LiveTime])
      })

    }

    if(PlayersActive){
      var p=[]
      Players.forEach((e,j)=>{
        for(var m=0; m<Markets.length; m++){
          p[m]=[LivePrice[m],
            LiveAvrgs[m][e.params[1]]-LiveAvrgs[m][e.params[0]],
            LiveAvrgs[m][e.params[2]]-LiveAvrgs[m][e.params[1]],
            LiveAvrgs[m][e.params[2]]-LiveAvrgs[m][e.params[0]],
            LiveAvrgs[m][e.params[2]]-Avrgs[m][e.params[2]][I(0)]]
        }
        PlayerReact(j,ServerTime,p)
      })

      if(PlayersTradeAutosave){
        PlayersTradeAutosave=false
        Autosave()
      }
    }
  }
  else{
    //when T has passed
    LiveTime=0;
    await (new Promise((resolve,reject)=>{ SyncServerTime(resolve) }))

    for(var m=0; m<Markets.length; m++){
      var res=await (new Promise((resolve,reject)=>{ binance.futuresMarkPrice(Markets[m]).then(resolve) }))

      if(res.markPrice==undefined){
        console.log(res);
      }else{
        LivePrice[m]=parseFloat(res.markPrice)
        LivePriceLn[m]=Math.log(LivePrice[m])
      }
      if(LivePrice[m]==null){
        LivePrice[m]=Price[m][Head]
        LivePriceLn[m]=Math.log(LivePrice[m])
      }

    }


    AdvanceHistory()

    if(PlayersActive){
      var p=[]
      Players.forEach((e,j)=>{
        for(var m=0; m<Markets.length; m++){
          p[m]=[LivePrice[m],
            LiveAvrgs[m][e.params[1]]-LiveAvrgs[m][e.params[0]],
            LiveAvrgs[m][e.params[2]]-LiveAvrgs[m][e.params[1]],
            LiveAvrgs[m][e.params[2]]-LiveAvrgs[m][e.params[0]],
            LiveAvrgs[m][e.params[2]]-Avrgs[m][e.params[2]][I(1)]]
        }
        PlayerReact(j,ServerTime,p)
      })

      if(PlayersTradeAutosave){
        PlayersTradeAutosave=false
        Autosave()
      }
    }

  }
}
//advance the historical arrays with the Live data
//doesnt trigger player reactions
//possible problem with long term accuracy of the historical arrays, as
//  they are always advanced and never recalculated from scratch... (we'll see)
function AdvanceHistory(){
  Stats.AdvanceHistory++;
  Head=(Head-1<0?(Head-1+HistorySize):(Head-1))

  LastTime=ServerTime

  Markets.forEach((e,m)=>{
    Price[m][Head]=LivePrice[m]
    PriceLn[m][Head]=LivePriceLn[m]

    //advance every avrg
    AvrgsToUpdate.forEach((p,t)=>{
      Avrgs[m][p.HalfWeight][Head]=
        (( Avrgs[m][p.HalfWeight][I(1)]*p.Asum - Avrgs[m][p.HalfWeight][I(p.depth)]*p.Atable[p.depth-1])*p.A  + PriceLn[m][Head])
        /p.Asum;

      LiveAvrgs[m][p.HalfWeight]=Avrgs[m][p.HalfWeight][Head]
    })

  })

}

//if is requesting new prices and updating all the rest
var ProgressOn=false;
function ToggleProgress(){
  if(ProgressOn){
    ProgressOn=false;
    LiveTime=0; LivePrice=1; LivePriveLn=0;
    clearInterval(LiveIntervalID)
    LiveIntervalID=-1;
  }else{
    ProgressOn=true;
    SyncServerTime()
    //while the history is found, wait T and then start LiveNext interval
    setTimeout(()=>{
      LiveTime=T-LiveT; //to make the first LiveNext() trigger advance history
      LiveIntervalID=setInterval(LiveNext,LiveT*1000);
    },3*T*1000-LiveT*1000)
    FindHistory()
  }
  Autosave()
  console.log("ToggleProgress/ toggled "+ProgressOn);
}






//players, all kept track of, but just one is employed triggers real trades
//if players react to the live market
var PlayersActive=false
//if any player has traded during last react call, triggers autosave
var PlayersTradeAutosave=false
//players are defined by their avrgs (halfweight values of the avrgs that they watch)
//  and weights (used for the decision weighted sum)
var Players=[]
function PushPlayer(params){
  var c={
    //the Player is still completely indipendent, this just tells him to route his
    //  trade triggers to the Me object, and also passing weighted sum history
    employed:false,

    //current state variables
    position:"none", //current trade position, none/long/short
    positionMarket:-1,
    invested:0, //quantity invested in the position
    margin:0, //initial margin of the position
    worth:1000,

    //ai parameters of the player
    //0: main halfweight
    //1: fast halfweight
    //2: fastest halfweight
    //3: price/lastprice take profit trigger
    //4: fast-main swing trigger
    //5: fastest-main trade trigger
    params:params,

    //ai state variables
    swingLong:[], //if currently in a swing
    swingShort:[],
    endedLong:[], //if has ended trade and has to reset
    endedShort:[],
    missedLong:[], //if missed an opportunity to trade
    missedShort:[],
    lastPrice:1, //price of the last triggered trade, used in endposition to calculate result

    //stats
    trades:0
  }
  Markets.forEach((e)=>{
    c.swingLong.push(false)
    c.swingShort.push(false)
    c.endedLong.push(false)
    c.endedShort.push(false)
    c.missedLong.push(false)
    c.missedShort.push(false)
  })
  Players.push(c);
  console.log("PushPlayer/ pushed player, params: "+params);
  for(var i=0; i<3; i++){
    var present=false;
    AvrgsToUpdate.forEach((p,t)=>{
      if(p.HalfWeight==params[i]){
        present=true
      }
    })
    if(!present){
      PushAverage(params[i])
    }
  }
}
//player functions
function PlayerEndpos(j,p){
  if(Players[j].position=="long"){
    Players[j].worth+=Players[j].margin*Leverage*(p[Players[j].positionMarket][0]/Players[j].lastPrice*(1-Fee)-(1+Fee))
    Players[j].trades++
  }
  else if(Players[j].position=="short"){
    Players[j].worth+=Players[j].margin*Leverage*((1-Fee)-p[Players[j].positionMarket][0]/Players[j].lastPrice*(1+Fee))
    Players[j].trades++
  }

  Players[j].position="none"
  Players[j].positionMarket=-1
  Players[j].invested=0
  Players[j].margin=0

  if(Players[j].employed){ EndPosition() }

  PlayersTradeAutosave=true
}
function PlayerTrade(j,m,long,p){
  Players[j].position=long?"long":"short"
  Players[j].invested=Math.floor(Players[j].worth*Leverage/(p[m][0]*(1+Fee*Leverage))*1000)/1000
  Players[j].margin=Players[j].invested*p[m][0]/Leverage
  Players[j].positionMarket=m
  Players[j].lastPrice=p[m][0]

  if(Players[j].employed){ Trade(m,!long) }

  PlayersTradeAutosave=true
}
//player react to a new market state:
//0: price
//1: fast-main
//2: fastest-fast
//3: fastest-main
//4: fastestD
function PlayerReact(j,time,p){
  if(Players[j].positionMarket!=-1){
    if(Players[j].position=="long"){
      if(p[Players[j].positionMarket][0]/Players[j].lastPrice>Players[j].params[3]
         && p[Players[j].positionMarket][4]<0){
        PlayerEndpos(j,p)
      }
      else if(p[Players[j].positionMarket][2]<0){
        PlayerEndpos(j,p)
      }
    }
    else if(Players[j].position=="short"){
      if(Players[j].lastPrice/p[Players[j].positionMarket][0]>Players[j].params[3]
         && p[Players[j].positionMarket][4]>0){
        PlayerEndpos(j,p)
      }
      else if(p[Players[j].positionMarket][2]>0){
        PlayerEndpos(j,p)
      }
    }
  }

  for(var m=0; m<Markets.length; m++){

    if(p[m][2]<0){
      Players[j].endedLong[m]=false
      Players[j].swingLong[m]=false

      if( !Players[j].endedShort[m] && !Players[j].swingShort[m] && p[m][1]>Players[j].params[4] ){
        Players[j].swingShort[m]=true
      }
    }
    else{
      Players[j].endedShort[m]=false
      Players[j].swingShort[m]=false

      if( !Players[j].endedLong[m] && !Players[j].swingLong[m] && p[m][1]<-Players[j].params[4] ){
        Players[j].swingLong[m]=true
      }
    }

    if(Players[j].swingLong[m]){
      if(p[m][3]>-Players[j].params[5] && !Players[j].missedLong[m]){
        if(Players[j].positionMarket==-1){
          PlayerTrade(j,m,true,p)
          Players[j].swingLong[m]=false
          Players[j].endedLong[m]=true
        }
        else{
          Players[j].missedLong[m]=true
        }
      }
      else if(Players[j].positionMarket==-1 && p[m][3]<-Players[j].params[5]){
        Players[j].missedLong[m]=false
      }
    }
    else if(Players[j].swingShort[m]){
      if(p[m][3]<Players[j].params[5] && !Players[j].missedShort[m]){
        if(Players[j].positionMarket==-1){
          PlayerTrade(j,m,false,p)
          Players[j].swingShort[m]=false
          Players[j].endedShort[m]=true
        }
        else{
          Players[j].missedShort[m]=true
        }
      }
      else if(Players[j].positionMarket==-1 && p[m][3]>Players[j].params[5]){
        Players[j].missedShort[m]=false
      }
    }
  }

  if(Players[j].employed){
    Markets.forEach((e,m)=>{
      Me.closestSwingSide[m]=(p[m][1]>0?"short":"long")
      Me.closestSwing[m]=(Me.closestSwingSide[m]=="long"?Players[j].swingLong[m]:Players[j].swingShort[m])
      Me.swingTriggerSum[m]=p[m][1]*(Me.closestSwingSide[m]=="long"?1:-1)+Players[j].params[4]
      Me.unswingTriggerSum[m]=p[m][2]*(Me.closestSwingSide[m]=="long"?1:-1)
      Me.tradeTriggerSum[m]=p[m][3]*(Me.closestSwingSide[m]=="long"?-1:1)-Players[j].params[5]

      if(isNaN(Me.closestSwing[m])){ Me.closestSwing[m]=0 }
      if(isNaN(Me.swingTriggerSum[m])){ Me.swingTriggerSum[m]=0 }
      if(isNaN(Me.unswingTriggerSum[m])){ Me.unswingTriggerSum[m]=0 }
      if(isNaN(Me.tradeTriggerSum[m])){ Me.tradeTriggerSum[m]=0 }
    })
    if(Players[j].positionMarket==-1){
      Me.liveResult=0
    }
    else{
      Me.liveResult=100*Leverage*(Players[j].position=="long"?(p[Players[j].positionMarket][0]/Players[j].lastPrice*(1-Fee)-(1+Fee)):((1-Fee)-p[Players[j].positionMarket][0]/Players[j].lastPrice*(1+Fee)))

      if(isNaN(Me.liveResult)){ Me.liveResult=0 }
    }
  }
}
//reset the players to starting condition
function PlayersReset(){
  Players.forEach((e)=>{
    e.position="none"
    e.positionMarket=-1
    e.invested=0
    e.margin=0
    e.worth=1000

    e.swingLong=[]
    e.swingShort=[]
    e.endedLong=[]
    e.endedShort=[]
    e.missedLong=[]
    e.missedShort=[]
    Markets.forEach((m)=>{
      e.swingLong.push(false)
      e.swingShort.push(false)
      e.endedLong.push(false)
      e.endedShort.push(false)
      e.missedLong.push(false)
      e.missedShort.push(false)
    })
    e.lastPrice=1
    e.trades=0
  })
}
//remove the player and any accociated avrgs, if not used by anyone else
function UnloadPlayer(n){
  if(n<Players.length){
    var removed="";
    for(var i=0; i<3; i++){
      var present=false;
      for(var j=0; j<Players.length; j++){
        if(j!=n){
          for(var k=0; k<3; k++){
            if(Players[n].params[i]==Players[j].params[k]){
              present=true; k=999;
            }
          }
        }
      }
      if(!present){
        removed+="  "+Players[n].params[i];
        UnloadAverage(Players[n].params[i]);
      }
    }
    Players.splice(n,1);
    console.log("UnloadPlayer/ unloaded player "+n+", removed associated non used averages:"+removed);
  }
}

app.get("/GetPlayers",(req,res)=>{
  res.send(JSON.stringify(Players,null,2))
})
app.get("/ResetPlayers",(req,res)=>{
  PlayersReset()

  Autosave()

  res.send("ok")
})
app.get("/PushPlayer/:p",(req,res)=>{
  var p=JSON.parse(req.params.p)
  for(var i=0; i<p.length; i++){
    p[i]=parseFloat(p[i])
  }
  PushPlayer(p)
  Autosave()
  res.send("Pushed Player")
})
app.get("/UnloadPlayer/:i",(req,res)=>{
  UnloadPlayer(parseInt(req.params.i))

  Autosave()
  res.send("Unloaded Player")
})
app.get("/EmployPlayer/:i",(req,res)=>{
  var i=parseInt(req.params.i)
  if(Players[i].employed){ Players[i].employed=false;}
  else{
    for(var j=0; j<Players.length; j++){
      Players[j].employed=false;
    }
    Players[i].employed=true;
    Me.params=Players[i].params;
  }

  Autosave()
  res.send("Employed Player")
})






//Me object refers to the real parameters that define the binance account
//like a player, but real and guaranteed to be always up to date-->not editable/resettable
var Me={
  //futures wallet variables
  capital:1000, //max withdrawable amount
  invested:0, //quantity invested in current position
  initialMargin:0, //capital used to open the position
  unrealizedProfit:0, //capital gained by the position so far
  worth:1000,  //capital+initialMargin+unrealizedProfit-finalFee

  position:"none", //current trade position: none/short/long
  positionMarket:-1,

  //trade history list, {side, time, price, worth, result , log...} for every trade
  trades:[],
  //the params of the employed player
  params:[-1,-1,-1],

  lastPrice:1, //price of last triggered trade

  //current state information for the client, is updated by the employed player
  closestSwingSide:[], //what side is closest to a swing, long or short
  closestSwing:[], //if the closestSwingSide is swinging
  swingTriggerSum:[], //bias-|fast-main| sum that triggers a swing
  unswingTriggerSum:[], //-1/1 * fastest-fast sum that triggers off a swing, positive means failed swing
  tradeTriggerSum:[], //bias-|fastest-main| sum that triggers a trade
  liveResult:0, //if position!=none: percent result between live price and trade price
}
app.get("/GetMe",(req,res)=>{
  res.send(JSON.stringify(Me,null,2))
})
function ResetMe(){
  Me.capital=1000
  Me.invested=0
  Me.initialMargin=0
  Me.unrealizedProfit=0,
  Me.worth=1000
  Me.position="none"
  Me.positionMarket=-1
  Me.trades=[]
  Me.params=[-1,-1,-1]
  Me.lastPrice=1
  Me.closestSwingSide=[]
  Me.closestSwing=[]
  Me.swingTriggerSum=[]
  Me.unswingTriggerSum=[]
  Me.tradeTriggerSum=[]
  Me.liveResult=0
  Markets.forEach((e,m)=>{
    Me.closestSwingSide[m]="long"
    Me.closestSwing[m]=false
    Me.swingTriggerSum[m]=0
    Me.unswingTriggerSum[m]=0
    Me.tradeTriggerSum[m]=0
  })
}
app.get("/ResetMe",(req,res)=>{
  ResetMe()
  Autosave()
  res.send("ok")
})
Markets.forEach((e,m)=>{
  Me.closestSwingSide[m]="long"
  Me.closestSwing[m]=false
  Me.swingTriggerSum[m]=0
  Me.unswingTriggerSum[m]=0
  Me.tradeTriggerSum[m]=0
})



//binance node request calling functions
//theese are used as the promise constructur functions, when response arrives resolve it
//  they also automatically manage potential error pushing
//MARGIN TRADING, not used
function mgAccountReq(params,resolve){
  binance.mgAccount(...params,(err,res)=>{
    if(err){ PushError(1,"mgAccount",JSON.parse(err.body),params,resolve) }
    else{ resolve(res) }
  })
}
function maxBorrowableReq(params,resolve){
  binance.maxBorrowable(...params,(err,res)=>{
    if(err){ PushError(2,"maxBorrowable",JSON.parse(err.body),params,resolve) }
    else{ resolve(res) }
  })
}
function pricesReq(params,resolve){
  binance.prices(...params,(err,res)=>{
    if(err){ PushError(3,"prices",JSON.parse(err.body),params,resolve) }
    else{ resolve(res) }
  })
}
function mgBorrowReq(params,resolve){
  binance.mgBorrow(...params,(err,res)=>{
    if(err){ PushError(4,"mgBorrow",JSON.parse(err.body),params,resolve) }
    else{ resolve(res) }
  })
}
function mgRepayReq(params,resolve){
  binance.mgRepay(...params,(err,res)=>{
    if(err){ PushError(5,"mgRepay",JSON.parse(err.body),params,resolve) }
    else{ resolve(res) }
  })
}
function mgMarketBuyReq(params,resolve){
  binance.mgMarketBuy(...params,(err,res)=>{
    if(err){ PushError(6,"mgMarketBuy",JSON.parse(err.body),params,resolve) }
    else{ resolve(res) }
  })
}
function mgMarketSellReq(params,resolve){
  binance.mgMarketSell(...params,(err,res)=>{
    if(err){ PushError(7,"mgMarketSell",JSON.parse(err.body),params,resolve) }
    else{ resolve(res) }
  })
}
//FUTURES TRADING
function futAccountReq(params,resolve){
  binance.futuresAccount().then((res)=>{
    if(res.code!=undefined){ PushError(8,"futAccount",res,params,resolve) }
    else{ resolve(res) }
  })
}
function futPriceReq(params,resolve){
  binance.futuresMarkPrice(...params).then((res)=>{
    if(res.code!=undefined){ PushError(9,"futPrice",res,params,resolve) }
    else{ resolve(res) }
  })
}
function futMarketBuyReq(params,resolve){
  binance.futuresMarketBuy(...params).then((res)=>{
    if(res.code!=undefined){ PushError(10,"futMarketBuy",res,params,resolve) }
    else{ resolve(res) }
  })
}
function futMarketSellReq(params,resolve){
  binance.futuresMarketSell(...params).then((res)=>{
    if(res.code!=undefined){ PushError(11,"futMarketSell",res,params,resolve) }
    else{ resolve(res) }
  })
}
function futLimitBuyReq(params,resolve){
  binance.futuresBuy(...params).then((res)=>{
    if(res.code!=undefined){ PushError(12,"futLimitBuy",res,params,resolve) }
    else{ resolve(res) }
  })
}
function futLimitSellReq(params,resolve){
  binance.futuresSell(...params).then((res)=>{
    if(res.code!=undefined){ PushError(13,"futLimitSell",res,params,resolve) }
    else{ resolve(res) }
  })
}
function futOrderBookReq(params,resolve){
  binance.futuresDepth(...params).then((res)=>{
    if(res.code!=undefined){ PushError(14,"futOrderBook",res,params,resolve) }
    else{ resolve(res) }
  })
}



//update the wallet variables in the Me object
async function UpdateWallet(callback){
  //request account info
  var t=await (new Promise((resolve,reject)=>{ futAccountReq([],resolve) }));
  if(t==-1){  }
  else{
    Me.capital=parseFloat(t.maxWithdrawAmount)

    if(Me.positionMarket!=-1){
      var p=t.positions.find((e)=>{return e.symbol==Markets[Me.positionMarket]})
      Me.initialMargin=parseFloat(p.initialMargin)
      Me.invested=(Me.initialMargin!=0 && parseFloat(p.entryPrice)>0)?parseFloat((Me.initialMargin/parseFloat(p.entryPrice)*Leverage).toFixed(AmountPrecision[Markets[Me.positionMarket]])):0;
      Me.unrealizedProfit=parseFloat(p.unrealizedProfit)
    }
    else{
      Me.initialMargin=0
      Me.invested=0
      Me.unrealizedProfit=0
    }

    Me.worth=Me.capital+(Me.initialMargin+Me.unrealizedProfit)*(1-Fee);

    console.log("UpdateWallet/ wallet: "+Me.capital+", "+Me.initialMargin+", "+Me.invested+", "+Me.unrealizedProfit+", "+Me.worth);

    if(callback!=null){callback()}
  }
}

//react to the trade trigger of the employed player
//places max buy/sell order, assumes current position is none
async function Trade(m,sell){
  console.log("Trade/ Started trade sequence....")
  UpdateWallet(async function(){
    var lastPrice=1; var tstart=Date.now();
    var tradeLog="tradeLog/:    Started trade sequence, wallet: "+Me.capital+", "+Me.initialMargin+", "+Me.invested+", "+Me.unrealizedProfit+"\n";
    var t;//temporary pass-through variable

    tradeLog+="-starting "+(sell?"short":"long")+" "+Markets[m]+" -->\n";

    if(!sell){

      //ask best price on the order book to calculate maxinvbuy
      t=await(new Promise((resolve,reject)=>{ futOrderBookReq([Markets[m],{limit:5}],resolve) }));
      if(t==-1){ return }
      else{
        //lastPrice=parseFloat((parseFloat(t.asks[0][0])+2*MinPriceStep[Markets[m]]).toFixed(PricePrecision[Markets[m]]))
        lastPrice=parseFloat(t.asks[0][0])
        var maxInvBuy=parseFloat((Me.capital*Leverage/(lastPrice*(1+Fee*Leverage))*MarketPriceK).toFixed(AmountPrecision[Markets[m]]))
        tradeLog+="  -requested order book, best price: "+lastPrice+", calculated max inv buyable: "+maxInvBuy+"\n";
      }

      //schedule full inv buy order
      if(maxInvBuy>0){
        t=await (new Promise((resolve,reject)=>{ futLimitBuyReq([Markets[m],maxInvBuy,lastPrice,{timeInForce:"GTC"}],resolve) }));
        if(t==-1){  }
        else{
          Me.invested=maxInvBuy
          Me.capital=RoundTo8(Me.capital-Me.invested*lastPrice/Leverage/(1-Fee))
          tradeLog+="  -full inv buy executed, wallet: "+Me.capital+", "+Me.initialMargin+", "+Me.invested+", "+Me.unrealizedProfit+"\n";
        }
      }

      tradeLog+="Ended Long trade sequence, time: "+(Date.now()-tstart)+"ms   :/tradeLog";
    }else{

      //ask best price on the order book to calculate maxinvsell
      t=await(new Promise((resolve,reject)=>{ futOrderBookReq([Markets[m],{limit:5}],resolve) }));
      if(t==-1){ return }
      else{
        //lastPrice=parseFloat((parseFloat(t.bids[0][0])-2*MinPriceStep[Markets[m]]).toFixed(PricePrecision[Markets[m]]))
        lastPrice=parseFloat(t.bids[0][0])
        var maxInvSell=parseFloat((Me.capital*Leverage/(lastPrice*(1+Fee*Leverage))*MarketPriceK).toFixed(AmountPrecision[Markets[m]]))
        tradeLog+="  -requested order book, best price: "+lastPrice+", calculated max inv sellable: "+maxInvSell+"\n";
      }

      //schedule full inv sell order
      if(maxInvSell>0){
        t=await (new Promise((resolve,reject)=>{ futLimitSellReq([Markets[m],maxInvSell,lastPrice,{timeInForce:"GTC"}],resolve) }));
        if(t==-1){  }
        else{
          Me.invested=maxInvSell
          Me.capital=RoundTo8(Me.capital-Me.invested*lastPrice/Leverage/(1-Fee))
          tradeLog+="  -full inv sell executed, wallet: "+Me.capital+", "+Me.initialMargin+", "+Me.invested+", "+Me.unrealizedProfit+"\n";
        }
      }

      tradeLog+="Ended Short trade sequence, time: "+(Date.now()-tstart)+"ms   :/tradeLog";
    }

    Me.position=(sell?"short":"long")
    Me.positionMarket=m

    UpdateWallet(()=>{
      UpdateNew=true

      Me.trades.unshift({
        market:Markets[m],
        side:(sell?"SHORT":"LONG"),
        time:tstart,
        price:lastPrice,
        worth:Me.worth,
        result:0,
        log:tradeLog,
      })
      Me.lastPrice=lastPrice;

      console.log("Trade/ ....Concluded trade sequence, trade log:"); console.log(tradeLog)

      Autosave()
      UpdateNew=true;

      var msg={
        time:(""+(new Date(tstart))),
        market:Me.trades[0].market,
        side:Me.trades[0].side,
        price:Me.trades[0].price,
        worth:Me.trades[0].worth,
        result:Me.trades[0].result,
        log:tradeLog.split("\n"),
      }
      SendEmail("Concluded "+(sell?"SHORT":"LONG")+" trade sequence",JSON.stringify(msg,null,2))
    })
  })
}
//conclude current trading position, return to position "none"
async function EndPosition(){
  console.log("EndPosition/ Started endposition sequence....");
  UpdateWallet(async function(){
    var tradeLog="tradeLog/:  Started endposition sequence, wallet: "+Me.capital+", "+Me.initialMargin+", "+Me.invested+", "+Me.unrealizedProfit+"\n";
    var lastPrice=1; var tstart=Date.now();
    var t;//temporary pass-through variable
    var m=Me.positionMarket

    if(Me.position=="long"){
      tradeLog+="-starting long close "+Markets[m]+" -->\n";

      //ask best price on the order book
      t=await(new Promise((resolve,reject)=>{ futOrderBookReq([Markets[m],{limit:5}],resolve) }));
      if(t==-1){ return }
      else{
        //lastPrice=parseFloat((parseFloat(t.bids[0][0])-MinPriceStep[Markets[m]]).toFixed(PricePrecision[Markets[m]]))
        lastPrice=parseFloat(t.bids[0][0])
        tradeLog+="  -requested order book, best price: "+lastPrice+", to sell: "+Me.invested+"\n";
      }

      //schedule inv sell order
      if(Me.invested>0){
        t=await (new Promise((resolve,reject)=>{ futLimitSellReq([Markets[m],Me.invested,lastPrice,{timeInForce:"GTC"}],resolve) }));
        if(t==-1){  }
        else{
          Me.capital=Me.worth;
          Me.invested=0;
          Me.initialMargin=0;
          Me.unrealizedProfit=0;
          tradeLog+="  -inv sell executed, wallet: "+Me.capital+", "+Me.initialMargin+", "+Me.invested+", "+Me.unrealizedProfit+"\n";
        }
      }

      tradeLog+="Ended endlongposition sequence, time: "+(Date.now()-tstart)+"ms   :/tradeLog";
    }
    else if(Me.position=="short"){
      tradeLog+="-starting short close "+Markets[m]+" -->\n";

      //ask best price on the order book
      t=await(new Promise((resolve,reject)=>{ futOrderBookReq([Markets[m],{limit:5}],resolve) }));
      if(t==-1){ return }
      else{
        //lastPrice=parseFloat((parseFloat(t.asks[0][0])+MinPriceStep[Markets[m]]).toFixed(PricePrecision[Markets[m]]))
        lastPrice=parseFloat(t.asks[0][0])
        tradeLog+="  -requested order book, best price: "+lastPrice+", to buy: "+Me.invested+"\n";
      }

      //schedule inv buy order
      if(Me.invested>0){
        t=await (new Promise((resolve,reject)=>{ futLimitBuyReq([Markets[m],Me.invested,lastPrice,{timeInForce:"GTC"}],resolve) }));
        if(t==-1){  }
        else{
          Me.capital=Me.worth;
          Me.invested=0;
          Me.initialMargin=0;
          Me.unrealizedProfit=0;
          tradeLog+="  -inv buy executed, wallet: "+Me.capital+", "+Me.initialMargin+", "+Me.invested+", "+Me.unrealizedProfit+"\n";
        }
      }

      tradeLog+="Ended endshortposition sequence, time: "+(Date.now()-tstart)+"ms   :/tradeLog";
    }
    else{
      tradeLog+="Ended endposition sequence, current position was none, nothing happened   :/tradeLog";
    }

    Me.positionMarket=-1

    UpdateWallet(()=>{
      Me.trades.unshift({
        market:Markets[m],
        side:Me.position, //endposition trades are marked by lower case side string
        time:tstart,
        price:lastPrice,
        worth:Me.worth,
        result:(Me.position=="long"?(lastPrice/Me.lastPrice*(1-Fee)-(1+Fee)):((1-Fee)-lastPrice/Me.lastPrice*(1+Fee))),
        log:tradeLog,
      })
      Me.position="none"

      var msg={
        time:(""+(new Date(tstart))),
        market:Me.trades[0].market,
        side:Me.trades[0].side,
        price:Me.trades[0].price,
        worth:Me.trades[0].worth,
        result:Me.trades[0].result,
        log:tradeLog.split("\n"),
      }
      SendEmail("Concluded endposition sequence",JSON.stringify(msg,null,2))

      console.log("EndPostion/ ....Concluded endposition sequence, trade log:"); console.log(tradeLog);

      Autosave()
      UpdateNew=true;
    })
  })
}






//binance api error management
//if an error occurs, it will be stored here with all its relevant context information
var Errors=[];
//array of consecutive counted errors of the same id, indexed by the id
//is not kept track of in the autosave
var ErrorCount=[];
var ErrorMaxCount=[999,3,3,3,2,2,2,2,3,3,2,2,2,2,3]; //max consecutive errors per id
//fast error pushing function
//if conditions are met, retry function wil be called
function PushError(id,place,body,params,resolve){
  Autosave()

  console.log();
  var time=(new Date(Date.now()));
  console.log("-ERROR id "+id+"  at   "+place+"   the   "+time+"   with   "+(params.join(", ")));
  console.log("  -body: code: "+body.code+",  msg: "+body.msg);

  //advance the count for the pushed error
  if(ErrorCount[id]!=null){ErrorCount[id]++}else{ErrorCount[id]=1}
  var log="  -count: "+ErrorCount[id]+" -> ";
  //based on the count, decide what to do
  if(ErrorCount[id]>ErrorMaxCount[id]){
    log+="exceeded -> resolving -1 and shutting down";
    console.log(log);
    ErrorCount[id]=0;
    resolve(-1)
    Shutdown()}
  //based on the id, route to the specific countermeasure
  else{
    log+="minimal -> employing countermeasure";
    console.log(log);
    switch(id) {
      case 0: //test error
        ErrorCount[id]=0;
        resolve(-1);
        break;
      case 1: //mgAccount
        //just retry
        setTimeout(()=>{ mgAccountReq(params,resolve) },ErrorCount[id]*1000)
        break;
      case 2: //maxBorrowable
        //just retry
        setTimeout(()=>{ maxBorrowableReq(params,resolve) },(ErrorCount[id]*500))
        break;
      case 3: //mgPrices
        //just retry
        setTimeout(()=>{ pricesReq(params,resolve) },(ErrorCount[id]*500))
        break;
      case 4: //borrow
        //amount exceeding max
        if(body.code==-3008){ ErrorCount[id]=0; resolve(-1) }
        else{ setTimeout(()=>{ mgBorrowReq(params,resolve) },ErrorCount[id]*1000)}
        break;
      case 5: //repay
        //repay amount is more than borrow
        if(body.code==-3013){ ErrorCount[id]=0; resolve(-1) }
        else if(body.code==-3041){ ErrorCount[id]=0; resolve(-1) }
        else{ setTimeout(()=>{ mgRepayReq(params,resolve) },ErrorCount[id]*1000)}
        break;
      case 6: //mgBuy
        //amount too small
        if(body.code==-1013){ ErrorCount[id]=0; resolve(-1) }
        //insufficient funds
        else if(body.code==-2010){ ErrorCount[id]=0; resolve(-1) }
        else{ setTimeout(()=>{ mgMarketBuyReq(params,resolve) },ErrorCount[id]*1000)}
        break;
      case 7: //mgSell
        //amount too small
        if(body.code==-1013){ ErrorCount[id]=0; resolve(-1) }
        //insufficient funds
        else if(body.code==-2010){ ErrorCount[id]=0; resolve(-1) }
        else{ setTimeout(()=>{ mgMarketSellReq(params,resolve) },ErrorCount[id]*1000)}
        break;
      case 8: //futAccount
        //just retry
        setTimeout(()=>{ futAccountReq(params,resolve) },ErrorCount[id]*1000)
        break
      case 9: //futPrice
        //just retry
        setTimeout(()=>{ futPriceReq(params,resolve) },(ErrorCount[id]*500))
        break
      case 10: //futMarketBuy
        //quantity less than 0
        if(body.code==-4003){ ErrorCount[id]=0; resolve(-1) }
        //insufficient funds
        else if(body.code==-2019){ ErrorCount[id]=0; resolve(-1) }
        else{ setTimeout(()=>{ futMarketBuyReq(params,resolve) },ErrorCount[id]*1000)}
        break
      case 11: //futMarketSell
        //quantity less than 0
        if(body.code==-4003){ ErrorCount[id]=0; resolve(-1) }
        //insufficient funds
        else if(body.code==-2019){ ErrorCount[id]=0; resolve(-1) }
        else{ setTimeout(()=>{ futMarketSellReq(params,resolve) },ErrorCount[id]*1000)}
        break
      case 12: //futLimitBuy
        //quantity less than 0
        if(body.code==-4003){ ErrorCount[id]=0; resolve(-1) }
        //insufficient funds
        else if(body.code==-2019){ ErrorCount[id]=0; resolve(-1) }
        else{ setTimeout(()=>{ futLimitBuyReq(params,resolve) },ErrorCount[id]*1000)}
        break
      case 13: //futLimitSell
        //quantity less than 0
        if(body.code==-4003){ ErrorCount[id]=0; resolve(-1) }
        //insufficient funds
        else if(body.code==-2019){ ErrorCount[id]=0; resolve(-1) }
        else{ setTimeout(()=>{ futLimitSellReq(params,resolve) },ErrorCount[id]*1000)}
        break
      case 14: //futOrderBook
        //just retry
        setTimeout(()=>{ futOrderBookReq(params,resolve) },(ErrorCount[id]*500))
      default:
        log+="  ||||  id not defined, calling shutdown";
        resolve(-1)
        console.log(log)
        Shutdown()
    }
  }

  if(Errors.length>500){Errors.pop()}
  Errors.unshift({
    id:id, //every binance request has its id, based on the id the countermeasure to the error is chosen
    place:place, //which request
    time:""+time, //time date format
    body:body, //error.body --> {code:1000, msg:""}
    params:params, //the parameters put in the fucntion
    log:log, //log created by the switch statement
  })

  Autosave()

  SendEmail("Error occurred",JSON.stringify(Errors,null,2))
}
//create a test error
async function TestError(){
  console.log("TestError/ submitted test error");
  var t=await (new Promise((resolve,reject)=>{
    PushError(0,"TestError",{code:6666, msg:"test error message"},[6,6,6,6],resolve)
  }))
}
app.get("/TestError",(req,res)=>{
  TestError()
  res.send("ok")
})
app.get("/GetErrors",(req,res)=>{
  res.send("<pre>"+JSON.stringify(Errors,null,2)+"</pre>")

})
app.get("/ResetErrors",(req,res)=>{
  Errors=[]; ErrorCount=[];
  Autosave()
  res.send("ok");
})







//the timestamp on the binance server
var ServerTime=Date.now();
function SyncServerTime(callback){
  httpsGet(api+"time",(res)=>{
    Stats.Sync++;
    var t=parseInt(JSON.parse(res).serverTime);
    //console.log("SyncServerTime/ error: "+(ServerTime-t)+"ms");
    ServerTime=t;

    if(callback!=null){callback()}
  });
}
SyncServerTime();
//var SyncIntervalID=setInterval(SyncServerTime,SyncT*1000);




//some stats from application start
var Stats={
  Tstart:Date.now(), //timestamp since latest server start
  Tonline:[], //time online for each hypothetical server restart, most recent is index 0
  Restarted:-1, //how many time has the server restarded and loaded correctly previous autosave
  Sync:0,
  LivePrice:0,
  AdvanceHistory:0,
}
app.get("/GetStats",(req,res)=>{
  Stats.Tonline[0]=(Date.now()-Stats.Tstart)/1000;
  res.send("<pre>"+JSON.stringify(Stats,null,2)+"</pre>")
})
app.get("/ResetStats",(req,res)=>{
  Stats={
    Tstart:Date.now(),
    Tonline:[0],
    Restarted:0,
    Sync:0,
    LivePrice:0,
    AdvanceHistory:0,
  }
  Autosave()
  res.send("ok")
})

//autosaving management
var AutosaveFile={}
function Autosave(){
  //dont want to fix now, so if elements are null just convert to 0
  for(var e in Me){
    if(Me[e]==null){ Me[e]=0 }
    else if(Array.isArray(Me[e])){ Me[e].forEach((f)=>{if(f==null){ f=0 }}) }
  }

  Stats.Tonline[0]=(Date.now()-Stats.Tstart)/1000;
  AutosaveFile={
    T:T,
    ProgressOn:ProgressOn,
    PlayersActive:PlayersActive,
    Errors:Errors,
    Stats:Stats,
    Players:Players,
    Me:Me,
  }
  try{
    jeanpaultradingDB.ref("Autosave").set(AutosaveFile)
  }
  catch(e){
    ResetMe()
    AutosaveFile={
      T:T,
      ProgressOn:ProgressOn,
      PlayersActive:PlayersActive,
      Errors:Errors,
      Stats:Stats,
      Players:Players,
      Me:Me,
    }
    jeanpaultradingDB.ref("Autosave").set(AutosaveFile)
  }
}
setInterval(Autosave,3600000) //autosave every 1 hours
function LoadAutosave(){
  jeanpaultradingDB.ref("Autosave").once("value",(res)=>{
    var a=res.val()
    SendEmail("Loading Autosave",JSON.stringify(a,null,2))
    console.log("Loading Autosave")

    if(a.ProgressOn!=ProgressOn){
      ToggleProgress()
    }
    PlayersActive=a.PlayersActive

    Me=a.Me
    if(a.Me.trades==undefined){ Me.trades=[] }

    Players.forEach((e,i)=>{ UnloadPlayer(i) })
    if(a.Players!=undefined){
      a.Players.forEach((e)=>{
        PushPlayer(e.params)
        if(e.employed){
          Players[Players.length-1].employed=true
          Me.params=Players[Players.length-1].params
        }
        Players[Players.length-1].invested=e.invested
        Players[Players.length-1].worth=e.worth
        Players[Players.length-1].trades=e.trades
        Players[Players.length-1].position=e.position
        Players[Players.length-1].positionMarket=e.positionMarket
        Players[Players.length-1].lastPrice=e.lastPrice
      })
    }

    if(a.Errors!=undefined){ Errors=a.Errors }
    ErrorCount=[]
    ErrorMaxCount.forEach((e,i)=>{ ErrorCount.push(0) })

    Stats=a.Stats
    if(a.Stats.Tonline==undefined){ Stats.Tonline=[] }
    Stats.Tstart=Date.now()
    Stats.Restarted++
    Stats.Tonline.unshift(0)

    UpdateWallet(Autosave)
  })
}
app.get("/GetAutosave",(req,res)=>{
  Autosave()

  res.send("<pre>"+JSON.stringify(AutosaveFile,null,2)+"</pre>")
})
app.get("/ResetAutosave",(req,res)=>{
  fs.readFile("data/AutosaveBlank.json","utf8",(err,data)=>{
    if(err){console.log("ResetAutosave/ error in reading file")}
    else{
      jeanpaultradingDB.ref("Autosave").set(JSON.parse(data))
      setTimeout(LoadAutosave,2000)
    }
  })
  res.send("reset autosave submitted")
})
app.get("/LoadAutosave",(req,res)=>{
  LoadAutosave()
  res.send("load autosave submitted")
})
app.get("/GetTrades",(req,res)=>{
  res.send("<pre>"+JSON.stringify(Me.trades,null,2)+"</pre>")

})
app.get("/ResetTrades",(req,res)=>{
  Me.trades=[];
  Autosave()
  res.send("ok")
})







app.get("/SetMarket/:m",(req,res)=>{
  LiveChartMarket=parseInt(req.params.m)

  res.send("Set Market: "+LiveChartMarket)
})
app.get("/ResetHistory",(req,res)=>{
  if(ProgressOn){ToggleProgress()}
  ResetHistory()

  Autosave()
  res.send("Reset History")
})
app.get("/TogglePlayersActive",(req,res)=>{
  PlayersActive=!PlayersActive;

  Autosave()
  res.send("Toggled PlayersActive "+PlayersActive)
})
app.get("/ToggleProgress",(req,res)=>{
  ToggleProgress()
  res.send("Toggled Progress to "+ProgressOn)
})

app.get("/UpdateInfos",(req,res)=>{
  UpdateWallet(()=>{
    var a={
      Players:[],
      Me:Me,
      LastTime:LastTime,
      T:T,
      ProgressOn:ProgressOn,
      PlayersActive: PlayersActive,
    }
    Players.forEach((e)=>{
      a.Players.push({
        employed:e.employed,
        position:e.position,
        worth:e.worth,
        trades:e.trades,
        params:e.params
      })
    })

    res.send(a);
  })
})
var UpdateNew=false //triggered by anything of importance that the client should know about
var LiveChart=false //if live chart data is sent with updatefast
var LiveChartMarket=0 //market of the live chart
app.get("/ToggleLiveChart/:n",(req,res)=>{
  LiveChart=(req.params.n=="1")
  res.send("ok")
})
app.get("/UpdateFast",(req,res)=>{
  var a={
    worth: Me.worth,
    p:[
      Me.closestSwingSide[LiveChartMarket],
      Me.closestSwing[LiveChartMarket],
      Me.swingTriggerSum[LiveChartMarket],
      Me.unswingTriggerSum[LiveChartMarket],
      Me.tradeTriggerSum[LiveChartMarket],
      Me.liveResult
    ],
    new:UpdateNew,
  }
  if(LiveChart && LiveChartMarket!=-1 && Me.params[0]!=-1){
    a.chart={
      LiveTime:LiveTime,
      LivePrice:LivePriceLn[LiveChartMarket],
      LiveMain:LiveAvrgs[LiveChartMarket][Me.params[0]],
      LiveFast:LiveAvrgs[LiveChartMarket][Me.params[1]],
      LiveFastest:LiveAvrgs[LiveChartMarket][Me.params[2]],
      price:[],
      main:[],
      fast:[],
      fastest:[]
    }
    for(var i=0; i<30; i++){
      a.chart.price.push(PriceLn[LiveChartMarket][I(i)])
      a.chart.main.push(Avrgs[LiveChartMarket][Me.params[0]][I(i)])
      a.chart.fast.push(Avrgs[LiveChartMarket][Me.params[1]][I(i)])
      a.chart.fastest.push(Avrgs[LiveChartMarket][Me.params[2]][I(i)])
    }
  }
  UpdateNew=false;
  GuestActiveTrigger=true;
  res.send(a);
})

app.get("/UpdateHistory/:m/:resK/:start/:end",(req,res)=>{
  var m=parseInt(req.params.m)
  var resK=parseFloat(req.params.resK);
  var start=parseFloat(req.params.start); var end=parseFloat(req.params.end);
  //end -1 means end in LastTime
  if(end==-1){end=LastTime}
  //if a definite range is given, also add 20% padding at the extremes
  if(start!=-1 && end!=-1){ start-=(end-start)*0.2; end+=(end-start)*0.2; }
  var a=[];
  //assumes that the history array is full
  for(var i=Math.max(start,LastTime-HistoryDepth*1000+60000); i<=Math.min(end,LastTime-60000); i+=T*resK*1000){
    a.push(Price[m][I(Math.round((LastTime-i)/(T*1000)))])
  }
  //last element of array is the start time, then come the prices
  a.push(Math.max(start,LastTime-HistoryDepth*1000+1000))
  res.send(a)
})
app.get("/UpdateAvrg/:m/:resK/:w/:start/:end",(req,res)=>{
  if(req.params.w!="-1"){
    var m=parseInt(req.params.m)
    var resK=parseFloat(req.params.resK)
    var start=parseFloat(req.params.start); var end=parseFloat(req.params.end);
    if(end==-1){end=LastTime}
    if(start!=-1 && end!=-1){ start-=(end-start)*0.2; end+=(end-start)*0.2; }
    var w=parseFloat(req.params.w);
    var a=[];
    for(var i=Math.max(start,LastTime-HistoryDepth*1000+60000); i<=Math.min(end,LastTime-60000); i+=T*resK*1000){
      a.push(Avrgs[m][w][I(Math.round((LastTime-i)/(T*1000)))])
    }
    a.push(Math.max(start,LastTime-HistoryDepth*1000+1000))
    res.send(a)
  }else{
    res.send([]);
  }
})

app.get("/Trade/:side",(req,res)=>{
  Trade(LiveChartMarket,(req.params.side=="short"))
  res.send("manual trade "+req.params.side+" submitted")
})
app.get("/EndPosition",(req,res)=>{
  EndPosition()
  res.send("end position submitted")
})






//BINANCEPRICEGATHER APP integrated in trading app to save used dyno hours

var PriceGather={
  Markets:["BTCUSDT","BNBUSDT","BCHUSDT","ETHUSDT","XMRUSDT","LTCUSDT","IOTAUSDT"],
  T:10,
  Length:0,
  ServerStartTime:0,
}
PriceGather.ServerStartTime=Math.ceil(Date.now()/(PriceGather.T*1000))*PriceGather.T*1000

setTimeout(()=>{
  setInterval(()=>{
    PriceGather.Length++;
    PriceGather.Markets.forEach((e)=>{
      binance.futuresMarkPrice(e).then((res)=>{
        pricegatherDB.ref(e+"/"+PriceGather.ServerStartTime+"/"+PriceGather.Length).set(parseFloat(res.markPrice))
      })
    })
  },PriceGather.T*1000)
  console.log("ServerStartTime: "+PriceGather.ServerStartTime+", interval set");

  pricegatherDB.ref("TimeInstances/"+PriceGather.ServerStartTime).set(PriceGather.ServerStartTime)

},(PriceGather.ServerStartTime-Date.now()))
