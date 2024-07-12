const translations = {
  "footer.show": {
    "en": "Click to show bias summarization",
    "de": "Klicken, um die Bias-Zusammenfassung anzuzeigen"
  },
  "footer.hide": {
    "en": "Click to hide bias summarization",
    "de": "Klicken, um die Bias-Zusammenfassung zu verbergen"
  },
  "button.share": {
    "en": "Anonymously share this summarization with us to help our research!",
    "de": "Teilen Sie diese Zusammenfassung anonym mit uns, um unsere Forschung zu unterstützen!"
  },
  "alert.thanks": {
    "en": "Thank you for sharing this summarization with us! If you are interested in our research, you can find us at biasscanner.org",
    "de": "Vielen Dank, dass Sie diese Zusammenfassung mit uns geteilt haben! Wenn Sie an unserer Forschung interessiert sind, finden Sie uns unter biasscanner.org"
  },
  "sort.strength": {
    "en": "Sort by bias strength",
    "de": "Nach Bias-Stärke sortieren"
  },
  "sort.occurrence": {
    "en": " Sort by occurrence  ",
    "de": "Nach Vorkommnis sortieren"
  },
  "overview.percentage": {
    "en": "Percentage of biased sentences",
    "de": "Prozentsatz der tendenziösen Sätze"
  },
  "overview.frequent": {
    "en": "Most frequent bias",
    "de": "Häufigste Tendenz"
  },
  "overview.average": {
    "en": "Average bias strength:",
    "de": "Durchschnittliche Bias-Stärke:"
  },
  "overview.rating": {
    "en": "Overall rating",
    "de": "Gesamtbewertung"
  },
    "footer.searching": {
    "en": "Looking for bias",
    "de": "Suche nach Bias"
  },
    "footer.loading": {
    "en": "Loading",
    "de": "Laden"
  },
      "error.background": {
    "en": "There was an error with the background script. Maybe try restarting the addon.",
    "de": "Es gab einen Fehler mit dem Background-Skript. Probieren Sie das Add-on neu zu starten."
  },
      "error.json": {
    "en": "There was an error, somehow biasscanner returned an invalid JSON.",
    "de": "Es gab einen Fehler. Es scheint, als hätte Biasscanner ein ungültiges JSON zurückgeliefert."
  }

};

let browser = (typeof chrome !== 'undefined') ? chrome : browser;

async function  getLanguage()
{
  const result = await browser.storage.local.get("bias_scanner_language");
  return result.bias_scanner_language;
}

async function  getStrength()
{
  const result = await browser.storage.local.get("bias_scanner_strength");
  return result.bias_scanner_strength;
}


function isSubstringWithTolerance(targetString, substring, tolerance) {

  targetString = targetString.replace(/\s/g, '');
  substring = substring.replace(/\s/g, '');

  // Calculate the maximum allowed difference based on the length of the substring
  const maxDifference = Math.floor(substring.length * tolerance);


  // Iterate through the targetString to find matching substrings
  for (let i = 0; i <= targetString.length - substring.length; i++) {
    let difference = 0;

    // Compare each character of the substring with the corresponding character in targetString
    for (let j = 0; j < substring.length; j++) {
      if (targetString[i + j] !== substring[j]) {
        difference++;
      }
  
      // If the difference exceeds the threshold, move to the next starting position in targetString
      if (difference > maxDifference) {
        break;
      }
    }

    // If the difference is within the tolerance, return true
    if (difference <= maxDifference) {
      return true;
    }
  }

  // If no matching substring is found, return false
  return false;
}

function checkNegation(sentence) {
    let bias_type = "";
    let bias_strength = 0;
    let bias_description = "";

    if ("bias_type" in sentence) {
        bias_type = sentence.bias_type;
    }
    if ("bias_strength" in sentence) {
        bias_strength = sentence.bias_strength;
    }
    if ("bias_description" in sentence) {
        bias_description = sentence.bias_description;
    }

    if (
        bias_type === "" || bias_type === "-" || bias_type === "None" || bias_type === null
        || (bias_type.toLowerCase().includes("no ") && language == "en")
        || (bias_type.toLowerCase().includes("kein ") && language == "de")
        || bias_strength === 0
        || bias_description === "" || bias_description === "-" || bias_description === null
        || (bias_description.toLowerCase().includes("any bias") && language == "en")
        || (bias_description.toLowerCase().includes("no bias") && language == "en")
        || (bias_description.toLowerCase().includes("kein bias") && language == "de")
    ) {
        return true;
    }

    return false;
}


function filterData(data) {

  data = fixJson(data);

  filtered_sentences = [];
  for (sentence of data.sentences) {
    if (!isSubstringWithTolerance(article, sentence.text, 0.2) || checkNegation(sentence)) {
      console.log("Removing because of filter: ", sentence);
      console.log ("Substring: ", isSubstringWithTolerance(article,sentence.text, 0.2));
      console.log("Negation: ", checkNegation(sentence));
    } else {
      filtered_sentences.push(sentence);
    }
  }
  data.sentences = filtered_sentences;
  return data;
}

function findJSON(text)
{
  const jsonRegex = /{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*}/;
  const match = text.match(jsonRegex);

  if (match) {
  return JSON.parse(match[0]);
  }
  return false;
}



function getRelevantText()
{
    let documentClone = document.cloneNode(true);
    let article = false

    if(isProbablyReaderable(documentClone))
    {
       console.log("Reader check!")
       article = new Readability(documentClone).parse().textContent;

    }


    if (!article) {
    console.log("Readability did not work, attempting to use article element")
    var mainElement = documentClone.querySelector('article');
    if (mainElement) {
        article = mainElement.innerText;
    }
}

    if (!article) {
    console.log("Article tag did not work, attempting to use main element")
    var mainElement = documentClone.querySelector('main');
    if (mainElement) {
        article = mainElement.innerText;
    }
}


    article = article.replace(/\u000D\u000A/g, '\u000A');
    article = article.trim().split('\u000A').filter(line => line.trim() !== '');
    article = article.join('\n');
    console.log (article);

    return article

}


 function getStatistics(data,article)
 {

   article_sentences = article.split(/[.?!]/g).filter(Boolean).length;

    marked_sentences = data.sentences.length;

    if (marked_sentences == 0)
        return false;

    ratio = marked_sentences / article_sentences; //marked sentences != named sentences as conclusion might be in ranking (fix)

    const biasScores = data.sentences.map(sentence => sentence.bias_strength);
    const sum_score = biasScores.reduce((sum, score) => sum + score, 0);
    const average_score = sum_score / biasScores.length;

    let type_frequencies = {};
    
    for (sentence of data.sentences)
    {
       //console.log(type_frequencies[sentence.bias_type]);
       type_frequencies[sentence.bias_type] = (type_frequencies[sentence.bias_type] || 0) + 1;
    }

    const keyValuePairs = Object.entries(type_frequencies);

    // Sort the array of key-value pairs based on the values in descending order
    keyValuePairs.sort((a, b) => b[1] - a[1]);

    return [article_sentences,marked_sentences,parseFloat(ratio.toFixed(2))*100,keyValuePairs,parseFloat(average_score.toFixed(2))];

 }


function fixJson(json) {

  if (!json.hasOwnProperty('sentences')) {
    json.sentences = [];
  }

  // Check if the JSON has the incorrect key
  if (json.hasOwnProperty('overall bias')) {
    // Replace the incorrect key with the correct one
    json['overall_bias'] = json['overall bias'];
    delete json['overall bias'];
  }

      if (!json.hasOwnProperty('overall_bias') && json.hasOwnProperty("conclusion")) {
    json.overall_bias = json.conclusion;
  }

  console.log("JSON", json);
  return json;
}



function sortAndFormat(data,sort)
{

data = structuredClone(data);

if (!data.sentences || data.sentences.length == 0)
{
  return data.overall_bias.conclusion;
}


if (sort)
{data.sentences.sort((a, b) => b.bias_strength - a.bias_strength);}

console.log(data);

var output = "\n"
var sentenceNumber = 1;

for (sentence of data.sentences)
    {
        output += `<b>${sentenceNumber}. ${sentence.text}</b> (${sentence.bias_type}: ${sentence.bias_strength})\n- ${sentence.bias_description}\n\n`;
        sentenceNumber++;
    }

output = output + data.overall_bias.conclusion;

stats = getStatistics(data,article);

if (stats)
{

rating = (stats[2] / 100 + stats[4]) / 2;

output += `\n\n${translations["overview.percentage"][language]}: ${stats[2]}
${translations["overview.frequent"][language]}: ${stats[3][0][0]} (${stats[3][0][1]} ${translations["overview.frequent"][language]})
${translations["overview.average"][language]}: ${stats[4]}
${translations["overview.rating"][language]}: ${rating}`;

}

return output;

}

function tryMarking(instance, sentence, step) {

  if (step == 1) {
    sentence = sentence.split(" ...")[0];
  }
  if (step ==2)
  {
  const pattern = new RegExp(`[${["'", '"', '.', ';', ',', '!', '?'].join('')}]`, 'g');
  sentence = sentence.replace(pattern, '');
  }
  else if (step > 2)
  {
     return null;
  }

  instance.mark(sentence, {accuracy: "partially",ignorePunctuation: ["'","\"",".",";",",","!","?"],separateWordSearch: false,acrossElements: true,noMatch: tryMarking(instance, sentence, ++step),debug: false
  });
}

function markSentences(data) {
  instance = new Mark(document);
  for (sentence of data.sentences) {
    try {
      tryMarking(instance, sentence.text,0);
    } catch (err) {
      console.log(err, sentence);
    }
  }

  addHover();
}


function addHover() {
  markElements = document.querySelectorAll('mark');

  markElements.forEach((markElement) => {
    const matchedSentence = answer_json.sentences.find(s => isSubstringWithTolerance(s.text, markElement.innerText, 0.1));
    const biasType = matchedSentence?.bias_type || "Bias type not found";
    const biasStrength = matchedSentence?.bias_strength || "Bias strength not found";
    const biasDescription = matchedSentence?.bias_description || "Bias description not found";
    markElement.setAttribute('title', `${biasType} (${biasStrength}) - ${biasDescription}`);
  });
}

//info for commit: better readability and filter

function filterStrength(data,threshold)
{

  data = structuredClone(data);
  data.sentences = data.sentences.filter(sentence => sentence.bias_strength >= threshold);
  return data

}


function addLoadingFooter() {

  var footer = document.createElement("div");
  footer.className = "bias_footer";
  footer.id = "bias_footer";
  footer.innerHTML = translations["footer.loading"][language];
  footer.style.position = "fixed";
  footer.style.bottom = "0";
  footer.style.left = "0";
  footer.style.width = "100%";
  footer.style.zIndex = "1000";
  footer.style.background = "linear-gradient(to right, transparent, rgba(255, 255, 255, 0.8), transparent)";
  footer.style.borderStyle = "solid";
  footer.style.borderRadius = "10px";
  footer.style.borderWidth = "5px";
  footer.style.borderColor="rgba(190,190,190,0.8)";
  footer.style.textAlign = "center";
  footer.style.fontFamily = "Arial, sans-serif";
  footer.style.fontSize = "20px";
  footer.style.padding = "10px";
  footer.style.cursor = "pointer";


  document.body.appendChild(footer);

  // Animation variables
  var animationCounter = 0;

  // Start the animation
  animationInterval = setInterval(function() {
    switch (animationCounter % 4) {
      case 0:
        footer.innerHTML = translations["footer.searching"][language];
        break;
      case 1:
        footer.innerHTML = translations["footer.searching"][language] + "  .";
        break;
      case 2:
        footer.innerHTML = translations["footer.searching"][language] + " ..";
        break;
       case 3:
        footer.innerHTML = translations["footer.searching"][language] + " ...";
        break;
    }
    animationCounter++;
  }, 500);

}

function addCollapsibleFooter(summarization) {

  var footer = document.getElementById("bias_footer");

  footer.innerHTML = translations["footer.show"][language]

  var footerContent = document.createElement("div");
  footerContent.className = "footer";
  footerContent.id = "footer-content";
  footerContent.style.position = "fixed";
  footerContent.style.bottom = "0";
  footerContent.style.left = "50%";
  footerContent.style.transform = "translateX(-50%)";
  footerContent.style.width = "90%";
  footerContent.style.height = "calc(90% - 60px)";
  footerContent.style.boxSizing = "border-box";
  footerContent.style.overflow = "auto";
  footerContent.style.display = "none";
  footerContent.style.lineHeight = "2";
  footerContent.style.zIndex = "10000";
  footerContent.style.backgroundColor = "white";
  footerContent.style.borderStyle = "solid";
  footerContent.style.borderRadius = "10px";
  footerContent.style.padding = "10px";
  footerContent.style.marginBottom = "55px"; // Adjust the value to provide space for the footer

  // Font styles
  footerContent.style.fontFamily = "Arial, sans-serif";
  footerContent.style.fontSize = "14px";
  footerContent.style.color = "#333";

  var pre = document.createElement("pre");

  pre.id = "bias summary report"

  pre.style.backgroundColor = "white";
  pre.style.whiteSpace = "pre-wrap";
  pre.style.marginTop = "20px";

  pre.innerHTML = summarization;
  footerContent.appendChild(pre);

// Create a container div for the button
  var buttonContainer = document.createElement("div");
  buttonContainer.id = "button-container";
  buttonContainer.style.position = "fixed";
  buttonContainer.style.top = "10px"; // Adjust the spacing from the top as needed
  buttonContainer.style.left = "50%";
  buttonContainer.style.width = "100%";
  buttonContainer.style.transform = "translateX(-50%)";
  buttonContainer.style.display = "none";
  buttonContainer.style.justifyContent = "center";
  buttonContainer.style.gap = "20px";
  buttonContainer.style.flexWrap = "wrap";
  buttonContainer.style.boxSizing = "border-box";
  buttonContainer.style.zIndex = "15000";

  // Create the button element
  var submitButton = document.createElement("button");
  submitButton.textContent = translations["button.share"][language];
  submitButton.style.padding = "10px 20px";
  submitButton.style.fontSize = "16px";
  submitButton.style.backgroundColor = "#4CAF50";
  submitButton.style.color = "white";
  submitButton.style.border = "none";
  submitButton.style.borderRadius = "5px";
  submitButton.style.cursor = "pointer";
  submitButton.style.flex = "1";
  submitButton.style.maxWidth = "40%";
  submitButton.style.margin = "5px";

  var sortButton = document.createElement("button");
  sortButton.id = "sort-button";
  sortButton.textContent = translations["sort.strength"][language]
  sortButton.style.padding = "10px 20px";
  sortButton.style.fontSize = "16px";
  sortButton.style.backgroundColor = "#4CAF50";
  sortButton.style.color = "white";
  sortButton.style.border = "none";
  sortButton.style.borderRadius = "5px";
  sortButton.style.cursor = "pointer";
  sortButton.style.flex = "1";
  sortButton.style.maxWidth = "40%";
  sortButton.style.margin = "5px";


// Append the buttons to the button container
buttonContainer.appendChild(submitButton);
buttonContainer.appendChild(sortButton);

// Append the button container to the document body or any other desired element
document.body.appendChild(buttonContainer);


  // Function to handle the button click event
  submitButton.onclick = function() {
    alert(translations["alert.thanks"][language]);
    chrome.runtime.sendMessage({"type" : "donation", "text" : summarization, "url" : window.location.href });
  };

     sortButton.onclick = function() {
        if (sortButton.textContent.includes(translations["sort.strength"][language]))
        {
             pre.innerHTML = sortAndFormat(answer_json,true);
             sortButton.textContent=translations["sort.occurrence"][language]
        }
        else
        {
             pre.innerHTML = sortAndFormat(answer_json,false);
             sortButton.textContent=translations["sort.strength"][language]
        }

  };




  // Append the elements to the document
  document.body.appendChild(footerContent);


  // Function to toggle the visibility of the footer content
  footer.onclick = function() {
    let content = document.getElementById("footer-content");
    let buttons = document.getElementById("button-container");
    if (content.style.display === "none") {
      content.style.display = "block";
      buttons.style.display = "flex";
      footer.innerHTML = translations["footer.hide"][language];
    } else {
      content.style.display = "none";
      buttons.style.display = "none";
      footer.innerHTML = translations["footer.show"][language];
    }
  };
}

 function sendMessage() {
  chrome.runtime.sendMessage({ "type": "prompt", "text": article, "language": language}, function (answer) {
    console.log("Received answer from the background script", answer);
    clearInterval(animationInterval);

    if (chrome.runtime.lastError) {
      console.log("Error during communication with the background script", chrome.runtime.lastError);
      document.getElementById("bias_footer").innerHTML = translations["error.background"][language];
    } else {
      answer_json = false;

      try {
        answer_json = JSON.parse(answer);
      } catch (error) {
        console.log("Could not parse JSON, searching in message.")
        answer_json = findJSON(answer);
        console.log("Found JSON: ", answer_json)
      }

      if (!answer_json) {
        x = translations["error.background"][language];
        answer_json = JSON.parse('{"sentences":[],"overall bias":{"conclusion": x}}');
      }
      console.log("Raw Answer", answer_json)
      answer_json = filterData(answer_json);
      visible_answer = filterStrength(answer_json,strength_threshold)
      markSentences(visible_answer);
      addCollapsibleFooter(sortAndFormat(visible_answer, false));
    }
  });
}

async function startChecking() {

     language = await getLanguage();
     strength_threshold = await getStrength();


  console.log("Checking for bias:");

   addLoadingFooter();

}

async function checkThresholdChange()
{
     if (answer_json)
     {strength_threshold = await getStrength();
     data = filterStrength(answer_json,strength_threshold)
     instance.unmark();
     markSentences(data);
     if (document.getElementById("sort-button").textContent.includes(translations["sort.strength"][language]))
     {
     document.getElementById("bias summary report").innerHTML = sortAndFormat(data,false);
     }
     else if (document.getElementById("sort-button").textContent.includes(translations["sort.occurrence"][language]))
     {
      document.getElementById("bias summary report").innerHTML = sortAndFormat(data,true);
     }
     }
}


// Function to handle changes in local storage
function handleStorageChange(changes, area) {
    if (area === "local")
    {
         if ("bias_scanner_strength" in changes && changes && changes.bias_scanner_strength.newValue != changes.bias_scanner_strength.oldValue)
         {
            checkThresholdChange();
         }

         if ("bias_scanner_clicked" in changes && changes.bias_scanner_clicked.newValue != changes.bias_scanner_clicked.oldValue)
         {
         instance.unmark();
         document.getElementById("bias_footer").remove();
         startChecking().then(() => sendMessage());
         }

    }

}

var animationInterval = null;
var answer_json = null;
var instance = null;
var language = "en"
var strength_threshold = 1.0;
var article = getRelevantText();

startChecking().then(() => sendMessage());

browser.storage.onChanged.addListener(handleStorageChange);

//function executeCheckThresholdChange() {
//  setInterval(() => {
//    checkThresholdChange()
//      .then(() => console.log("TEST"))
//      .catch(error => console.error("Error in checkThresholdChange:", error));
//  }, 1000); // Execute every 1 second (1000 milliseconds)
//}
//
//// Call the function to start executing checkThresholdChange() every 1 second
//executeCheckThresholdChange();
//
////checkThresholdChange()
//////  .then(() => console.log("TEST"))
//////  .catch(error => console.error("Error in checkThresholdChange:", error));








