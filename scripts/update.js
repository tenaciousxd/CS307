var m=0;
var w=0;

function timeRunner(){
  var cd=new Date();
  if (cd.getDay()==1&&cd.getHours()>12&&m==0){
    main();
    m=1;
  }
  else if (cd.getDay()==3&&cd.getHours()>12&&w==0){
    main();
    w=1;
  }
  else if(cd.getDay()>3){
    m=0;
    w=0;
  }
  setTimeout(timeRunner,600000);
  console.log(cd.getHours());
}

timeRunner();


function main(){
  var parentPath='';

  const {Builder, By, Key, until} = require('selenium-webdriver');
  var r=require('request');
  var fs=require('fs');
  var u=require('username');

  let driver = new Builder()
    .forBrowser('firefox')
    .build()
    .then(driver=>{
      driver.get('http://www.cs.uah.edu/~rcoleman/CS307/TodaysClass/TodaysClass.html').then(()=>{
        driver.getPageSource().then(function(y){getImageURLs(y);driver.quit();});
      })

    });



  function getImageURLs(x){
    var imgL=x.indexOf('<img');
    var noImagesLeft=0;
    var imageURLArray=[];
    while (noImagesLeft==0){
      var imageURLFQuote=x.indexOf('"',imgL);
      var imageURLCQuote=x.indexOf('"',imageURLFQuote+1);
      imageURLArray.push(x.slice(imageURLFQuote+1,imageURLCQuote));
      imgL=x.indexOf('<img',imgL+1);
      if (imgL==-1){noImagesLeft=1}
    }
    genPath(imageURLArray,x);
  }

  function genPath(imageURLArray,x){
    if (parentPath.length<1){
      u().then(user=>{
        parentPath='C:/Users/'+user+'/Documents/CS307/';
        if(!fs.existsSync(parentPath)){fs.mkdirSync(parentPath)}
        getDate(x);
      })}
    else{
      if(!fs.existsSync(parentPath)){
        fs.mkdirSync(parentPath);
      }
      getDate(x);
    }
    function getDate(x){
      var months=['january','february','march','april','may','june','july','august','september','october','november','december'];
      var xL=x.toLowerCase();
      for (let i=0;i<months.length;i++){
        var monthL=xL.indexOf(months[i]);
        if (monthL!=-1) {
          if (xL.indexOf('<h1>', xL.slice(monthL - 30, monthL)) != -1) {
            for (let j = monthL; j < monthL + 30; j++) {
              if ((!isNaN(xL[j]))&&xL[j]!=' ') {
                var dayOfMonth=xL.slice(j,j+2).trim();
                if (dayOfMonth[1]=='<'){
                  dayOfMonth=dayOfMonth[0];
                }
                break;
              }
            }
            var d=new Date();
            var cd=(i+1)+'.'+dayOfMonth+'.'+d.getFullYear();
            parentPath=parentPath+cd+'/';
            if (!fs.existsSync(parentPath)){
              fs.mkdirSync(parentPath);
            }
            saveImages(imageURLArray);
            break;
          }
        }
      }
    }
  }

  function saveImages(x){
    var imageData=[];
    function saveImage(y){
      r({url:'http://www.cs.uah.edu/~rcoleman/CS307/TodaysClass/Images/'+x[y].slice(x[y].indexOf('/')+1),encoding:'binary'},function(e,r,b){
        fs.writeFileSync(parentPath+x[y].slice(x[y].indexOf('/')+1),b,'binary');
        imageData.push(x[y]+' : '+b.length);
        y++;
        if (y<x.length){
          saveImage(y);
        }
        else{
          fs.writeFileSync(parentPath+'imagedata.txt',imageData.join('\r\n'),'utf8');
          git();
        }
      })
    }
    saveImage(0);
  }


}

function git(){
  let fs=require('fs');
  let user=require('username').sync();

  let gitParent='c:/users/'+user+'/documents/github/cs307/';

  reaggImages();

  function reaggImages(){
    // reaggregates images from date-labeled folders within documents/cs307 into single a single cs307/images folder, first getting list of images already in directory, then
    // adding new images, also ignoring incomplete images and non-.jpg files and skipping duplicates

    let origDirParent='c:/users/'+user+'/documents/cs307';
    let destDirParent=gitParent+'images';
    let processedImages=[];

    processedImages=fs.readdirSync(destDirParent);

    fs.readdir(origDirParent,function(e,i){
      for (let j=0;j<i.length;j++){
        let currPI=fs.readdirSync(origDirParent+'/'+i[j]);
        for (let k=0;k<currPI.length;k++){
          if (processedImages.indexOf(currPI[k])==-1){
            if (fs.statSync(origDirParent+'/'+i[j]+'/'+currPI[k]).size>7000&&currPI[k].indexOf('.jpg')!=-1) {
              processedImages.push(currPI[k]);
              let currImage=fs.readFileSync(origDirParent+'/'+i[j]+'/'+currPI[k]);
              fs.writeFileSync(destDirParent+'/'+currPI[k],currImage);
            }}
        }
      }
      builddates();
    });
  }
  function builddates(){
    // constructs ordered array of dates objects, each with date attribute and array of names of images fully covered in class that day

    let origDirParent='c:/users/'+user+'/documents/cs307';
    let destDirParent=gitParent+'tdata';

    let dates=[];

    let childDirs=fs.readdirSync(origDirParent);

    for (let i=0;i<childDirs.length;i++){
      let tempImages=[]=fs.readFileSync(origDirParent+'/'+childDirs[i]+'/'+'imagedata.txt').toString().split(/\n?\r/);
      dates[i]={};
      dates[i].date=childDirs[i];
      console.log(childDirs[i]);
      dates[i].images=[];
      for (let j=0;j<tempImages.length;j++){
        if (tempImages[j].indexOf('/')!=-1){
          tempImages[j]=tempImages[j].slice(tempImages[j].indexOf('/')+1);
        }
        else if (tempImages[j].indexOf('\n')!=-1){
          tempImages[j]=tempImages[j].slice(tempImages[j].indexOf('\n')+1);
        }
        if (parseInt(tempImages[j].slice(tempImages[j].indexOf(':')+1))>7000){
          dates[i].images.push(tempImages[j].slice(0,tempImages[j].indexOf('.jpg')));
        }
      }
    }

    // basic swap sort since some dates are read out of order, could probably also apply built-in array sort to childDirs

    function swap(x,y){
      let tx=dates[x];
      dates[x]=dates[y];
      dates[y]=tx;
    }

    for (let i=0;i<dates.length;i++){
      let m1=parseInt(dates[i].date.slice(0,dates[i].date.indexOf('.')));
      let d1=parseInt(dates[i].date.slice(dates[i].date.indexOf('.')+1,dates[i].date.indexOf('.',dates[i].date.indexOf('.')+1)));
      for (let j=i;j<dates.length;j++){
        let m2=parseInt(dates[j].date.slice(0,dates[j].date.indexOf('.')));
        let d2=parseInt(dates[j].date.slice(dates[j].date.indexOf('.')+1,dates[j].date.indexOf('.',dates[j].date.indexOf('.')+1)));
        if ((m2<m1)||m1==m2&&d2<d1){
          swap(i,j);
          m1=parseInt(dates[i].date.slice(0,dates[i].date.indexOf('.')));
          d1=parseInt(dates[i].date.slice(dates[i].date.indexOf('.')+1,dates[i].date.indexOf('.',dates[i].date.indexOf('.')+1)));
        }
      }
    }

    fs.writeFileSync(destDirParent+'/dates.txt',JSON.stringify(dates),'utf8');
    console.log(dates);
    parseTopics();

  }

  function parseTopics(){
    // organizes images into topics based on their names, creates topics object with topic keys and image array values, refactors dates array to consist of objects
    // with a date key and an object with topic keys referencing 2 variable arrays of format [index of first image of posted that day within corresponding topics array, index of last image
    //posted that day within corresponding topics array]


    let datesFP=gitParent+'tdata/dates.txt';
    let topicsFP=gitParent+'tdata/topics.txt';



    let dates=JSON.parse(fs.readFileSync(datesFP));

    let topics={};

    function stripNums(imgStr){
      if (imgStr.indexOf('_')!=-1&&imgStr.lastIndexOf('_')>imgStr.length-5){
        return imgStr.slice(0,imgStr.lastIndexOf('_'));
      }
      else if (imgStr.indexOf('-')!=-1&&imgStr.lastIndexOf('-')>imgStr.length-5){
        return imgStr.slice(0,imgStr.lastIndexOf('-'));
      }
      else{
        let i=imgStr.length-1;
        while (!isNaN(imgStr[i])){
          i--;
        }
        return imgStr.slice(0,i+1);
      }
    }

    for (let i=0;i<dates.length;i++){
      let tTopics={};
      for (let j=0;j<dates[i].images.length;j++){
        let tTopic=stripNums(dates[i].images[j]);
        if (!tTopics.hasOwnProperty(tTopic)){
          tTopics[tTopic]=[];
          tTopics[tTopic][0]=dates[i].images[j];
        }
        else{
          tTopics[tTopic].push(dates[i].images[j]);
        }
        if (!topics.hasOwnProperty(tTopic)){
          topics[tTopic]=[];
          if (topics[tTopic].indexOf(dates[i].images[j])==-1){
            topics[tTopic][0]=dates[i].images[j];}
        }
        else if (topics[tTopic].indexOf(dates[i].images[j])==-1){
          topics[tTopic].push(dates[i].images[j]);
        }

      }
      dates[i].topics=tTopics;
      delete dates[i].images;
    }

    for (let i=0;i<dates.length;i++){
      for (let t in dates[i].topics){
        dates[i].topics[t]=[topics[t].indexOf(dates[i].topics[t][0]),topics[t].indexOf(dates[i].topics[t][dates[i].topics[t].length-1])];
      }
    }

    console.log(JSON.stringify(dates));

    fs.writeFileSync(datesFP,JSON.stringify(dates),'utf8');
    fs.writeFileSync(topicsFP,JSON.stringify(topics),'utf8');
    injectData();
  }

  function injectData(){
    //injects data from dates and topics into specified HTML file by setting corresponding variables within the first <script></script> in the page

    let htmlFP=gitParent+'index.html';


    let dates=JSON.parse(fs.readFileSync(gitParent+'tdata/dates.txt'));
    let topics=JSON.parse(fs.readFileSync(gitParent+'tdata/topics.txt'));

    let html=fs.readFileSync(htmlFP);

    let s=html.indexOf('<script');
    let h1=html.slice(0,s);
    let h2=html.slice(s);

    if (h2.indexOf('var dates')==-1){}
    else{h2=h2.slice(h2.indexOf('</script>')+9)}
    html=h1+'<script>'+'var dates='+JSON.stringify(dates)+';'+'var topics='+JSON.stringify(topics)+';'+'</script>'+h2;


    fs.writeFileSync(htmlFP,html,'utf8');
    gitSync();
  }

  function gitSync(){
    let cp=require('child_process');
    cp.execFileSync(gitParent+'scripts/gitSync.exe')
  }



}