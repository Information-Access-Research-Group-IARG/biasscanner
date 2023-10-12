const express = require('express')
const cors = require('cors')
const https = require("https");
const fs = require("fs");
const crypto = require('crypto');
const geoip = require('geoip-lite');
const app = express()
const port = 8080

app.use(cors())

app.use(express.json());

function checkPath(filename)
{
    const dirPath = filename.split('/').slice(0, -1).join('/');
    if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    }
}

function updateLogFile(request,type=0)
{

const ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
hash = crypto.createHash('sha256').update(ip).digest('hex');
country = geoip.lookup(ip);


const currentDate = new Date();

const day = String(currentDate.getDate()).padStart(2, '0');
const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-indexed, so we add 1 to get the correct month.
const year = currentDate.getFullYear();
const hours = String(currentDate.getHours()).padStart(2, '0');
const minutes = String(currentDate.getMinutes()).padStart(2, '0');
const seconds = String(currentDate.getSeconds()).padStart(2, '0');

const timestamp = `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;

let filename = "";
let log_entry = "";
if (type == 0)
{
filename = `logs/requests/requests${day}.${month}.${year}.txt`;
log_entry = {hash,country,timestamp};
}
else if (type == 1)
{
filename = `logs/summarizations/summarizations${day}.${month}.${year}.txt`;
const summarization = request.body.text;
const url = request.body.url;
log_entry = {hash,country,url,summarization,timestamp};
}

checkPath(filename);

const log_string = JSON.stringify(log_entry) + '\n';

        fs.appendFile(filename, log_string, (err) => {
          if (err) {
            console.error('Error writing to file:', err);
          } else {
            console.log('Updated log file');
          }
        });
}

function trackTraffic(request, response, limit,answer) {

  let filename = "logs/traffic/traffic.txt"
  try {
    var data = fs.readFileSync(filename, 'utf8');
    data = JSON.parse(data);
  } catch (err) {
    // If the file doesn't exist or there's an error, initialize the variables
    data = {
      used_incoming: 0,
      used_outgoing: 0,
    };
  }

  // Increment the variables
  data.used_incoming = data.used_incoming + parseInt(request.get('content-length'), 10);

  let under_limit;

console.log(data,limit);

  if (data.used_outgoing < limit) {
    response.send(answer);
    data.used_outgoing = data.used_outgoing + parseInt(response.get('content-length'), 10);
    under_limit = true; 
  }
  else {
   under_limit = false;
  }


  checkPath(filename)

  fs.writeFileSync(filename, JSON.stringify(data), 'utf8');
  return under_limit;
}


app.post('/', (request, response) => {

console.log(response.header);

var type = request.body.type;

var text = request.body.text;

if (type == "prompt")
{

updateLogFile(request,0);

fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': ""
  },
  body: JSON.stringify({
    "model": "gpt-3.5-turbo-16k",
    "messages": [{"role": "user", "content": text}],
    "temperature": 0.0
  })
})
  .then(response => response.json())
  .then(data => {
    // Handle the response data here
    console.log("Made API request");
    var answer = data.choices[0].message.content;
    console.log("ANSWER",answer);
    under_limit = trackTraffic(request,response,4398046511104,answer); //4 terrabyte
    if (!under_limit)
    {
       console.log("Limit for outgoing traffic exceeded!");
    }
  
    }
  )
  .catch(error => {
    // Handle any errors that occurred during the request
    console.error(error);
  });
}

else if (type == "donation")
{
   updateLogFile(request,1);
   console.log("Logged summarization");
}

})


const options = {
  key: fs.readFileSync("privkey.pem"),
  cert: fs.readFileSync("fullchain.pem"),
};

https
  .createServer(options, app)
  .listen(port, function () {
    console.log(`server is listening on ${port}`);
  });


