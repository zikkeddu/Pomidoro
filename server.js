var express = require('express');
var app = express();
var bodyParser = require('body-parser')
var file = require("fs");

var rootpath = {root: './public/views'};
var path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

// Tell express to use the body-parser middleware and to not parse extended bodies

app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json());


// Route that receives a POST request to /sessions

app.post('/api/sessions',function(req,res){
  var jsession_name = req.body.user;
  var jsession_data = req.body.data;

  if(!jsession_name || jsession_name === ""){
      console.log("not written file" + jsession_name + ".json");
      res.end("unsaved");
  }
  else{
  
       var contents = file.writeFile("data/json/" + jsession_name + ".json", jsession_data,
     	  function(err){
        	 if(err){
            		 console.log(err);
		         res.end("error_occurred");
		         next(err);
         	 } 
        	 else {
            	      console.log("written file" + jsession_name + ".json");
                      res.end("saved");
                 }
         }
      );
  }
});

app.get('/api/sessions/:name', function (req, res, next) {

  var options = {root: __dirname + '/data/json/', dotfiles: 'deny', headers: {'x-timestamp': Date.now(),'x-sent': true}};

  var fileName = req.params.name + '.json';

  res.sendFile(fileName, options, function (err){
      if(err){
          next(err);
      } 
      else {
          console.log('Sent:', fileName);
      }
  });

});


app.get('/', function(req, res){res.sendFile('index.html', rootpath);});

app.listen(80, function(){console.log("Con Ok");});
