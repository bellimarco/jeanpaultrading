//random utility functions
function httpGet(url, callback){
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
          callback(xmlHttp.responseText);
  }
  xmlHttp.open("GET", url, true);
  xmlHttp.send(null);
}

const digits=9;
const digitsMag=10000000; //10^(digits-1)
//return a string with a fixed number of digits
function ToFixedDigits(n){
  if(n>=1){
    var mag=0;
    var sci=n;
    while(sci>10){
      sci/=10;
      mag++;
    }
    return (n.toFixed(digits-Math.max(1,mag+1)))
  }else{
    return ((Math.round(n*digitsMag)/digitsMag).toFixed(digits-1))
  }
}






//data objects for the chart, dont redefine otherwise the chart object loses reference to them
var chartPrice=[]
var chartMain=[]
var chartFast=[]
var chartFastest=[]
//when manuallyrequesting avrgs, record the last set (0:main,1:fast) so that the other one will be deleted
var lastSet=1;

var chartConfig={
  theme: "light2",
  toolTip: {
		shared: true
	},
  legend: {
		cursor: "pointer",
		verticalAlign: "top",
		horizontalAlign: "center",
		dockInsidePlotArea: true,
    itemclick: toogleDataSeries
	},
  animationEnabled: true,
	zoomEnabled: true,
  axisX:{
    title:"",
    includeZero:false,
    reversed:false,
    labelMaxWidth: 30,
		crosshair: {	enabled: true,	},
    labelFormatter: function (e) { return CanvasJS.formatDate( e.value, "DD MMM"); },
  },
	axisY: {
		title: "",
    includeZero: false,
		crosshair: {
			enabled: true,
      snapToDataPoint:true,
		}
	},
  data: [
    {
      name: "Price",
      showInLegend: true,
      type: "line",
      indexLabelFontSize: 16,
      dataPoints: chartPrice
    },
    {
      name: "Main",
      showInLegend: true,
      type: "line",
      indexLabelFontSize: 16,
      dataPoints: chartMain
    },
    {
      name: "Fast",
      showInLegend: true,
      type: "line",
      indexLabelFontSize: 16,
      dataPoints: chartFast
    },
    {
      name: "Fastest",
      showInLegend: true,
      type: "line",
      indexLabelFontSize: 16,
      dataPoints: chartFastest
    }
  ]
}

var chart = new CanvasJS.Chart("chartContainer", chartConfig)
function toogleDataSeries(e){
	if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {	e.dataSeries.visible = false; }
  else{ e.dataSeries.visible = true; }
	chart.render();
}
chart.render()



//if the user can control the server
var Admin=false;
function CheckAdmin(x){
  httpGet("/CheckAdmin/"+x,(res)=>{
    if(res=="1"){ Admin=true;}
    else{
      Admin=false;
      alert("You are not an Admin")

      UpdateChart(-1,-1,Me.avrgs[0],Me.avrgs[1],Me.avrgs[2])
      setTimeout(()=>{
        if(!LiveChart){
          LiveChart=!LiveChart;
          httpGet("/ToggleLiveChart/"+(LiveChart?"1":-1),console.log)
          $("#LiveChart").css("background-color",(LiveChart?"#7FFF00":"#FF6347"))
        }
      },5000)
    }
  })
}




//for the historical arrays, request data in much lower resolution
var ChartResolution=1


var Market=0 //index of the currently followd market
const Markets=["BTCUSDT","BCHUSDT","XMRUSDT","IOTAUSDT"]
var LastTime=-1
var T=-1
var LiveT=2;

var Me={} //info relevant to the account
var Players=[]

//if with FastUpdate comes the lastest chart info and gets automatically rendered
var LiveChart=false;


//given ai params, update the html elements
function UpdateAIParams(p){
  $("#AIParams1").text("side: "+p[0]+"    trigger: "+p[1])
  $("#AIParams2").text("swing: "+ToFixedDigits(p[2])+"  unswing: "+ToFixedDigits(p[3]))
  $("#AIParams3").text("trade: "+ToFixedDigits(p[4])+"  result: "+(p[5]<0?"-":"+")+Math.round(p[5]*1000)/1000+"%")
}
//request all the info, the players, the trades
function UpdateInfos(callback){
  httpGet("/UpdateInfos",(res)=>{
    var a=JSON.parse(res)

    LastTime=a.LastTime;
    T=a.T;
    Me=a.Me;
    Players=a.Players;

    $("#Market").text(Markets[Market])
    $("#Capital").text(ToFixedDigits(Me.capital))
    $("#Margin").text(ToFixedDigits(Me.initialMargin))
    $("#Invested").text(ToFixedDigits(Me.invested))
    $("#Profit").text(ToFixedDigits(Me.unrealizedProfit))
    $("#Worth").text(ToFixedDigits(Me.worth))
    $("#Position").text(Me.position+(Me.positionMarket==-1?"":" "+Markets[Me.positionMarket]))

    $("#ToggleProgress").css("background-color",(a.ProgressOn?"#7FFF00":"#FF6347"))
    $("#TogglePlayersActive").css("background-color",(a.PlayersActive?"#7FFF00":"#FF6347"))

    $("#PlayersContainer").empty()
    Players.forEach((e,i)=>{
      $("#PlayersContainer").append("<div class='ListEntry' "+(e.employed?"style='background-color:#7FFF00'":"")+">"
        +i+")  worth: "+e.worth.toFixed(1)+" &nbsp side: "+e.position+" &nbsp trades: "+e.trades
        +" &nbsp {"+e.params.join(", ")+"}</div>")
    })

    $("#TradesContainer").empty()
    Me.trades.forEach((e,i)=>{
      $("#TradesContainer").append("<div class='ListEntry'>"
      + ("<div><pre>"+(new Date(e.time)).toLocaleString()+")  worth: "+ToFixedDigits(e.worth)+"    "+(e.result<0?"-":"+")+Math.abs(e.result).toFixed(2)+" %"+"</pre></div>")
      + ("<div><pre>"+e.market+" / "+e.side+"     "+ToFixedDigits(e.price)+"    <button id='ShowTrade"+i+"' class='ShowTradeButton'>show</button>")
      +"</div>")
      $("#ShowTrade"+i).click(()=>{
        httpGet("/SetMarket/"+Markets.indexOf(e.market),(res)=>{
          UpdateChart(e.time-3600000,e.time+3600000,Me.params[0],Me.params[1],Me.params[2])
          console.log(res)
        })
      })
    })

    console.log("Updated Infos")

    if(callback!=null){callback()}
  })
}
//update only regularly changin variables
function UpdateFast(){
  httpGet("/UpdateFast",(res)=>{
    var a=JSON.parse(res)

    Me.worth=a.worth;
    $("#Worth").text(ToFixedDigits(Me.worth))

    UpdateAIParams(a.p)

    //if on the server there is something new
    if(a.new){
      UpdateInfos()
    }

    //update livechart
    if(LiveChart && a.chart!=undefined){

      chartPrice.length=0; chartMain.length=0; chartFast.length=0; chartFastest.length=0;

      for(var i=0; i<a.chart.price.length; i++){
        chartPrice[i]={
          x:i*T+a.chart.LiveTime,
          y:a.chart.price[i],
        }

        chartMain[i]={
          x:i*T+a.chart.LiveTime,
          y:a.chart.main[i],
        }

        chartFast[i]={
          x:i*T+a.chart.LiveTime,
          y:a.chart.fast[i],
        }

        chartFastest[i]={
          x:i*T+a.chart.LiveTime,
          y:a.chart.fastest[i],
        }
      }

      chartPrice.unshift({
        x:0,
        y:a.chart.LivePrice,
      })
      chartMain.unshift({
        x:0,
        y:a.chart.LiveMain,
      })
      chartFast.unshift({
        x:0,
        y:a.chart.LiveFast,
      })
      chartFastest.unshift({
        x:0,
        y:a.chart.LiveFastest,
      })

      chartConfig.axisX.reversed=true;
      chart.render()
      chartConfig.axisX.reversed=false;
    }
  })
}
setInterval(UpdateFast,LiveT*1000);

//request a time window of the historical price
function UpdateHistory(start,end){
  UpdateInfos(()=>{
    console.log("Requesting History Data");
    httpGet("/UpdateHistory/"+Market+"/"+ChartResolution+"/"+start+"/"+end,(res)=>{
      var a=JSON.parse(res)
      chartPrice.length=0; chartFastest.length=0;
      //the requested arrays are ordered with tstart in 0 and tend at the end
      for(var i=0; i<a.length-1; i++){
        chartPrice[i]={
          x:(a[a.length-1]+i*T*ChartResolution*1000),
          y:a[i],
        }
      }
      chart.render()
    })
  })
}
//request a time window of an average, it must of course already be loaded
function UpdateAvrg(w,start,end){
  UpdateInfos(()=>{
    console.log("Requesting Avrg Data");
    httpGet("/UpdateAvrg/"+Market+"/"+ChartResolution+"/"+w+"/"+start+"/"+end,(res)=>{
      var a=JSON.parse(res)
      if(lastSet==0){ chartFastest.length=0; }
      else if(lastSet==1){ chartFast.length=0; }
      else if(lastSet==2){ chartMain.length=0; }
      //the requested arrays are ordered with tstart in 0 and tend at the end
      for(var i=0; i<a.length-1; i++){
        if(lastSet==0){
          chartFastest[i]={
            x:(a[a.length-1]+i*T*ChartResolution*1000),
            y:Math.exp(a[i]),
          }
        }
        else if(lastSet==1){
          chartFast[i]={
            x:(a[a.length-1]+i*T*ChartResolution*1000),
            y:Math.exp(a[i]),
          }
        }
        else if(lastSet==2){
          chartMain[i]={
            x:(a[a.length-1]+i*T*ChartResolution*1000),
            y:Math.exp(a[i]),
          }
        }
      }
      chart.render()
      lastSet=(lastSet+1>2?0:lastSet+1)
    })
  })
}
//request the historical arrays of a time window, and then display them in the chart
function UpdateChart(start,end,w0,w1,w2){
  UpdateInfos(()=>{
    console.log("Requesting Chart Data");
    httpGet("/UpdateHistory/"+Market+"/"+ChartResolution+"/"+start+"/"+end,(res)=>{
      var Price=JSON.parse(res);
      httpGet("/UpdateAvrg/"+Market+"/"+ChartResolution+"/"+w0+"/"+start+"/"+end,(res)=>{
        var Main=JSON.parse(res);
        httpGet("/UpdateAvrg/"+Market+"/"+ChartResolution+"/"+w1+"/"+start+"/"+end,(res)=>{
          var Fast=JSON.parse(res);
          httpGet("/UpdateAvrg/"+Market+"/"+ChartResolution+"/"+w2+"/"+start+"/"+end,(res)=>{
            var Fastest=JSON.parse(res);

            chartPrice.length=0; chartMain.length=0; chartFast.length=0; chartFastest.length=0;
            //the requested arrays are ordered with tstart in 0 and tend at the end
            if(Price.length>0 && Main.length>0){
              for(var i=0; i<Price.length-1; i++){
                chartPrice[i]={
                  x:(Price[Price.length-1]+i*T*ChartResolution*1000),
                  y:Price[i],
                  indexLabel:""
                }

                chartMain[i]={
                  x:(Price[Price.length-1]+i*T*ChartResolution*1000),
                  y:Math.exp(Main[i]),
                }
                chartFast[i]={
                  x:(Price[Price.length-1]+i*T*ChartResolution*1000),
                  y:Math.exp(Fast[i]),
                }
                chartFastest[i]={
                  x:(Price[Price.length-1]+i*T*ChartResolution*1000),
                  y:Math.exp(Fastest[i]),
                }
              }
            }
            //now display my trades, if there are
            Me.trades.forEach((e)=>{
              if(e.time>Price[Price.length-1] && e.time<Price[Price.length-1]+(Price.length-1)*ChartResolution*T*1000){
                chartPrice[Math.round((e.time-Price[Price.length-1])/(T*ChartResolution*1000))].indexLabel+=e.side.charAt(0);
                chartPrice[Math.round((e.time-Price[Price.length-1])/(T*ChartResolution*1000))].markerType="cross";
                chartPrice[Math.round((e.time-Price[Price.length-1])/(T*ChartResolution*1000))].markerColor="black";
              }
            })

            chart.render()
          })
        })
      })
    })
  });
}




$("#UpdateInfos").click(()=>{UpdateInfos()})
$("#ResetHistory").click(()=>{
  if(Admin){
    if(confirm("Are you sure?")){
      httpGet("/ResetHistory",(res)=>{
        console.log(res)
        UpdateInfos()
      })
    }
  }else{alert("you are not an Admin")}
})
$("#ToggleProgress").click(()=>{
  if(Admin){
    if(Market!="blank"){
      httpGet("/ToggleProgress",(res)=>{
        console.log(res)
        UpdateInfos()
      })
    }else{
      alert("Market invalid")
    }
  }else{alert("you are not an Admin")}
})
$("#TogglePlayersActive").click(()=>{
  if(Admin){
    httpGet("/TogglePlayersActive",(res)=>{
    console.log(res)
    UpdateInfos()
  })
  }else{alert("you are not an Admin")}
})

$("#ChartRes").on("change",()=>{
  ChartResolution=parseFloat($("#ChartRes").val())
})
$("#ChangeMarket").on("keypress",(e)=>{
  if(e.which==13){
    if(Admin){
      if($("#ChangeMarket").val().length>5){
        Market=Markets.indexOf($("#ChangeMarket").val())
        $("#Market").text(Markets[Market])
        httpGet("/SetMarket/"+Market,console.log)
      }
    }else{ alert("You are not an Admin") }
  }
})
$("#LoadPrice").on("keypress",(e)=>{
  if(e.which==13){
    var start=parseInt($("#LoadPrice").val().slice(0,$("#LoadPrice").val().indexOf(",")));
    var end=parseInt($("#LoadPrice").val().slice($("#LoadPrice").val().indexOf(",")+1));
    if(start!=0 && end!=0){
      UpdateHistory(start,end)
    }else{
      chartPrice.length=0;
      chart.render()
    }
  }
})
$("#LoadAvrg").on("keypress",(e)=>{
  if(e.which==13){
    var i=$("#LoadAvrg").val().indexOf(",");
    var start=parseInt($("#LoadAvrg").val().slice(0,i));
    var end=parseInt($("#LoadAvrg").val().slice(i+1,$("#LoadAvrg").val().indexOf(",",i+1)));
    var w=parseInt($("#LoadAvrg").val().slice($("#LoadAvrg").val().indexOf(",",i+1)+1));
    if(start!=0 && end!=0){
      UpdateAvrg(w,start,end)
    }else{
      chartMain.length=0; chartFast.length=0; chartFastest.length=0; lastSet=0;
      chart.render()
    }
  }
})
$("#LiveChart").click(()=>{
  LiveChart=!LiveChart;
  httpGet("/ToggleLiveChart/"+(LiveChart?"1":"0"),console.log)
  $("#LiveChart").css("background-color",(LiveChart?"#7FFF00":"#FF6347"))
  if(!LiveChart){
    chartPrice.length=0; chartMain.length=0; chartFast.length=0; chartFastest.length=0;
    chart.render()
  }
})

$("#AddPlayer").click(()=>{
  if(Admin){
    var input=prompt("Enter parameters:","Main, Fast, Fastest, W0, W1, W2, W3, W4, W5");
    if(input!=null){
      var p=[]
      var i=0;
      var j=input.indexOf(",")
      p.push(input.slice(i,j))
      i=j; j=input.indexOf(",",i+1)
      p.push(input.slice(i+1,j))
      i=j; j=input.indexOf(",",i+1)
      p.push(input.slice(i+1,j))
      i=j; j=input.indexOf(",",i+1)
      p.push(input.slice(i+1,j))
      i=j; j=input.indexOf(",",i+1)
      p.push(input.slice(i+1,j))
      i=j; j=input.indexOf(",",i+1)
      p.push(input.slice(i+1,j))
      i=j; j=input.indexOf(",",i+1)
      p.push(input.slice(i+1,j))
      i=j; j=input.indexOf(",",i+1)
      p.push(input.slice(i+1,j))
      i=j;
      p.push(input.slice(i+1))
      httpGet("/PushPlayer/"+JSON.stringify(p),(res)=>{
        console.log(res)
        UpdateInfos()
      });
    }
  }else{alert("you are not an Admin")}
})
$("#RemovePlayer").click(()=>{
  if(Admin){
    var i=prompt("Enter index of the plyer:")
    if(i!=null){
    httpGet("/UnloadPlayer/"+i,(res)=>{
      console.log(res)
      UpdateInfos();
    });
  }
  }else{alert("you are not an Admin")}
})
$("#EmployPlayer").click(()=>{
  if(Admin){
    var i=prompt("Enter index of the plyer:")
    if(i!=null){
    httpGet("/EmployPlayer/"+i,(res)=>{
      console.log(res)
      UpdateInfos();
    })
  }
  }else{alert("you are not an Admin")}
})

$("#tradeLong").click(()=>{
  if(Admin){
    httpGet("/Trade/long",console.log)
  }else{alert("you are not an Admin")}
})
$("#tradeShort").click(()=>{
  if(Admin){
    httpGet("/Trade/short",console.log)
  }else{alert("you are not an Admin")}
})
$("#endPosition").click(()=>{
  if(Admin){
    httpGet("/EndPosition",console.log)
  }else{alert("you are not an Admin")}
})



$(document).ready(()=>{
  //set some default things
  $("#ChangeMarket").val("BTCUSDT")
  $("#ChartRes").val(ChartResolution)
  UpdateInfos()

  httpGet("/ToggleLiveChart/0",(res)=>{})


  var input=prompt("Input password to become Admin: ");
  CheckAdmin(((input!=null && input.length>0)?input:"0"))

})
