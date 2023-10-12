function isSubstringWithTolerance(targetString, substring, tolerance) {
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
    let bias_score = 0;
    let bias_description = "";

    if ("bias_type" in sentence) {
        bias_type = sentence.bias_type;
    }
    if ("bias_score" in sentence) {
        bias_score = sentence.bias_score;
    }
    if ("bias_description" in sentence) {
        bias_description = sentence.bias_description;
    }

    if (
        bias_type === "" || bias_type === "-" || bias_type === "None" || bias_type === null
        || bias_type.toLowerCase().includes("no ")
        || bias_score === 0
        || bias_description === "" || bias_description === "-" || bias_description === null
        || bias_description.toLowerCase().includes("any bias")
        || bias_description.toLowerCase().includes("no bias")
    ) {
        return true;
    }

    return false;
}


function filterData(data) {
  filtered_sentences = [];
  for (sentence of data.sentences) {
    if (!isSubstringWithTolerance(article, sentence.text, 0.2) || checkNegation(sentence)) {
      console.log("Removing because of filter: ", sentence);
    } else {
      filtered_sentences.push(sentence);
    }
  }
  data.sentences = filtered_sentences;
  return data;
}


function getRelevantText()
{
    let documentClone = document.cloneNode(true);
    let article = new Readability(documentClone).parse().textContent;

raw_document_text = document.documentElement.innerText.replace(/[^a-zA-Z]/g, '')
raw_article_text = article.replace(/[^a-zA-Z]/g, '')

if (!isSubstringWithTolerance(raw_document_text,raw_article_text,0.2) || (raw_article_text.length / raw_document_text.length) < 0.05  )
{
    console.log("Readibility did not work, using innerText")
    article = document.documentElement.innerText;
}

article = article.replace(/\u000D\u000A/g, '\u000A');
article = article.trim().split('\u000A').filter(line => line.trim() !== '');
article = article.join('\n');

 return article;
}


 function getStatistics(data,article)
 {

   article_sentences = article.split(/[.?!]/g).filter(Boolean).length;

    marked_sentences = data.sentences.length;

    ratio = marked_sentences / article_sentences; //marked sentences != named sentences as conclusion might be in ranking (fix)

    const biasScores = data.sentences.map(sentence => sentence.bias_score);
    const sum_score = biasScores.reduce((sum, score) => sum + score, 0);
    const average_score = sum_score / biasScores.length;

    let type_frequencies = {};
    
    for (sentence of data.sentences)
    {
       console.log(type_frequencies[sentence.bias_type]);
       type_frequencies[sentence.bias_type] = (type_frequencies[sentence.bias_type] || 0) + 1;
    }

    const keyValuePairs = Object.entries(type_frequencies);

    // Sort the array of key-value pairs based on the values in descending order
    keyValuePairs.sort((a, b) => b[1] - a[1]);

    return [article_sentences,marked_sentences,parseFloat(ratio.toFixed(2))*100,keyValuePairs,parseFloat(average_score.toFixed(2))];

 }

function sortAndFormat(data,sort)
{

data = structuredClone(data);

if (!data.sentences || data.sentences.length == 0)
{
  return data.overall_bias.conclusion;
}

if (sort)
{data.sentences.sort((a, b) => b.bias_score - a.bias_score);}

var output = "\n"
var sentenceNumber = 1;

for (sentence of data.sentences)
    {
        output += `<b>${sentenceNumber}. ${sentence.text}</b> (${sentence.bias_type}: ${sentence.bias_score})\n- ${sentence.bias_description}\n\n`;
        sentenceNumber++;
    }

output = output + data.overall_bias.conclusion;

stats = getStatistics(data,article);

rating = (stats[2] / 100 + stats[4]) / 2;

output += `\n\nPercentage of biased sentences: ${stats[2]}\nMost frequent bias: ${stats[3][0][0]} (${stats[3][0][1]} times)\nAverage bias strength: ${stats[4]}\nOverall rating: ${rating}`

return output;

}

function markSentences(data)
{
  var instance = new Mark(document);
  for (sentence of data.sentences)
    {
      try
      {
      instance.mark(sentence.text, { accuracy: "complementary", separateWordSearch: false, acrossElements: true, debug: false });
      }
      catch (err)
      {
        console.log(err,sentence);
      }
    }
  }




function addLoadingFooter() {

  var footer = document.createElement("div");
  footer.className = "bias_footer";
  footer.id = "bias_footer";
  footer.innerHTML = "Loading";
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
        footer.innerHTML = "Looking for bias";
        break;
      case 1:
        footer.innerHTML = "Looking for bias  .";
        break;
      case 2:
        footer.innerHTML = "Looking for bias ..";
        break;
       case 3:
        footer.innerHTML = "Looking for bias ...";
        break;
    }
    animationCounter++;
  }, 500);

}

function addCollapsibleFooter(summarization) {


  var footer = document.getElementById("bias_footer");

  footer.innerHTML = "Click to show bias summarization";

  var footerContent = document.createElement("div");
  footerContent.className = "footer";
  footerContent.id = "footer-content";
  footerContent.style.position = "fixed";
  footerContent.style.bottom = "0";
  footerContent.style.left = "50%";
  footerContent.style.transform = "translateX(-50%)";
  footerContent.style.width = "90%";
  footerContent.style.height = "90%";

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
  pre.style.backgroundColor = "white";

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
  buttonContainer.style.zIndex = "15000";

  // Create the button element
  var submitButton = document.createElement("button");
  submitButton.textContent = "Anonymously share this summarization with us to help our research!";
  submitButton.style.padding = "10px 20px";
  submitButton.style.fontSize = "16px";
  submitButton.style.backgroundColor = "#4CAF50";
  submitButton.style.color = "white";
  submitButton.style.border = "none";
  submitButton.style.borderRadius = "5px";
  submitButton.style.cursor = "pointer";
  submitButton.style.position = "absolute";
  submitButton.style.left = "50%";
  submitButton.style.transform = "translate(-50%,0)";

  var sortButton = document.createElement("button");
  sortButton.textContent = "Sort by bias strength";
  sortButton.style.padding = "10px 20px";
  sortButton.style.fontSize = "16px";
  sortButton.style.backgroundColor = "#4CAF50";
  sortButton.style.color = "white";
  sortButton.style.border = "none";
  sortButton.style.borderRadius = "5px";
  sortButton.style.cursor = "pointer";
  sortButton.style.position = "absolute";
  sortButton.style.right = "5%";
  sortButton.style.width = "12%";
  sortButton.style.transform = "translate(5%,0)";


// Append the buttons to the button container
buttonContainer.appendChild(submitButton);
buttonContainer.appendChild(sortButton);

// Append the button container to the document body or any other desired element
document.body.appendChild(buttonContainer);





  // Function to handle the button click event
  submitButton.onclick = function() {
    alert("Thank you for your sharing this summarization with us! If you are interested in our research, you can find us under biasscanner.org");
    chrome.runtime.sendMessage({"type" : "donation", "text" : summarization, "url" : window.location.href });
  };

     sortButton.onclick = function() {
        if (sortButton.textContent.includes("bias strength"))
        {
             pre.innerHTML = sortAndFormat(answer_json,true);
             sortButton.textContent=" Sort by occurrence  ";
        }
        else
        {
             pre.innerHTML = sortAndFormat(answer_json,false);
             sortButton.textContent="Sort by bias strength";
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
      footer.innerHTML = "Click to hide bias summarization";
    } else {
      content.style.display = "none";
      buttons.style.display = "none";
      footer.innerHTML = "Click to show bias summarization";
    }
  };
}


var animationInterval = null;
var answer_json = null;
var article = getRelevantText();

var prompt = `You are a psycholinguist interested in studying news bias. Check if a news story contains examples of biased reporting. Focus on of  following biases:\nLinguistic bias encompasses all forms of bias induced by lexical features, such as word choice and sentence structure, often subconsciously used. Generally, linguistic bias is expressed through specific word choice that reflects the social-category cognition applied to any described group or individual(s).\nText-level context bias refers to the expression of a text\'s context, whereby words and statements can shape the context of an article and sway the reader\'s perspective. These biases can be used to portray a particular opinion in a biased way by criticizing one side more than the other, using inflammatory words, or omitting relevant information.\\r\\n\\r\\nReporting-level context bias refers to bias that arises through decisions made by editors and journalists on what events to report and which sources to use. While text-level context bias examines the bias present within an individual article, reporting-level bias focuses on systematic attention given to specific topics.\nCognitive bias occurs when readers introduce bias by selecting which articles to read and which sources to trust, which can be amplified in social media. These biases can lead to self-reinforcing cycles and expose readers to only one side of an issue.\nHate speech refers to any language that manifests hatred towards na specific group or aims to degrade, humiliate, or offend. Usually, hate speech is induced by using linguistic bias. Particularly in social media, the impact of hate speech is significant and exacerbates tensions between involved parties. However, similar processes can also be observed within, e.g., comments on news websites.\nFake news refers to published content based on false claims and premises, presented as being true to deceive the reader. Research on fake news detection typically focuses on detecting it through linguistic features or comparing content to verified information. Fake news have serious consequences, such as potential influences on the readers\' health and political decisions.\nRacial bias is expressed through negative or positive portrayals of racial groups. Research has shown that racial bias in news coverage can severely impact affected minorities, such as strengthening stereotypes and discrimination.\nGender bias in media can manifest as discrimination against one gender through underrepresentation or negative portrayal. Gender bias in media can severely impact perceptions of professions and role models, as well as voting decisions.\nPolitical bias refers to a text\'s political leaning or ideology, potentially influencing the reader\'s political opinion and, ultimately, their voting behavior. There are several approaches to detecting political bias in media, e.g., counting the appearance of certain political parties or ideology-associated words.\nFirst of all, check if any part of the article's reporting would fall under one of these bias criteria. Focus on the way an action is reported on, not the reported action itself. When identifying Text-level context bias, Reporting-level context bias or Cognitiive bias, be rather restrained and only name those in very obvious cases. If yes, in the second step, extract the sentences you identified as showing bias, name the type of bias, assign a score between 0 (no bias) and 1 (very high bias) indicating the strength of the bias. Finally, please conclude with a general assessment of whether the article as a whole seems to be biased towards one or more issues. Always answer with a JSON like this {\"sentences:[{\"text\": quote from article,\"bias_type\": bias type,\"bias_score\": bias strength, \"bias_description\":description of the bias and context},{\"text\": ...}, ...],\"overall bias\":{\"conclusion\": overall assessment of the article\'s bias.}}\n Properly escape all quotation marks in the JSON. \n If a sentence does not show any bias, never include it in the JSON.\n
If the article does not seem to exhibit any notable bias, answer with a JSON which only includes the conclusion property.\nHere is an example of how the output could like in practice:\n{ \"sentences\": [ { \"text\": \"While some misguided individuals may argue that salted popcorn is the pinnacle of flavor, they are sorely mistaken.\", \"bias_type\": \"Linguistic bias\", \"bias_score\": 0.6, \"bias_description\": \"This sentence uses the term \'misguided individuals\' to describe those who prefer salted popcorn, which introduces a negative judgment and bias against them.\" }, { \"text\": \"Critics of sweet popcorn often argue that it is too sugary and lacks the savory satisfaction of its salted counterpart. However, this misguided notion fails to appreciate the sheer joy that sweet popcorn brings to every movie night or afternoon snack.\", \"bias_type\": \"Linguistic bias\", \"bias_score\": 0.7, \"bias_description\": \"The term \'misguided notion\' is used to describe the criticism of sweet popcorn, implying that those who criticize it are mistaken or ignorant.\" }, { \"text\": \"So, the next time you find yourself reaching for a bag of salted popcorn, pause for a moment and consider the truly superior choice.\", \"bias_type\": \"Linguistic bias\", \"bias_score\": 0.8, \"bias_description\": \"The phrase \'truly superior choice\' implies a strong bias in favor of sweet popcorn, suggesting that it is the only correct or superior option.\" } ], \"overall_bias\": { \"conclusion\": \"The article exhibits linguistic bias throughout, with a consistent bias in favor of sweet popcorn and against those who prefer salted popcorn. The bias score for the article is relatively high, indicating a strong bias in its messaging.\" } }\nThis is the news story in question:\n${article}`;

console.log("Checking for bias:");
addLoadingFooter();
chrome.runtime.sendMessage({ "type": "prompt", "text": prompt }, function (answer) {
  console.log("Received answer from background script",answer);
  clearInterval(animationInterval);
  if (chrome.runtime.lastError)
  {
      console.log("Error during communication with background script",chrome.runtime.lastError);
      document.getElementById("bias_footer").innerHTML = "There was an error with the background script. Maybe try restarting the addon.";

  }
  else
  {
    answer_json = JSON.parse(answer);
    answer_json = filterData(answer_json);
    markSentences(answer_json);
    addCollapsibleFooter(sortAndFormat(answer_json,false));
  }

});








