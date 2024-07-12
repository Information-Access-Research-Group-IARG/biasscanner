const translations = {
  "button.detect": {
    "en": "Detect Bias!",
    "de": "Bias erkennen!"
  },
    "slider.strength": {
    "en": "Minimum Strength",
    "de": "Minimale Stärke"
  },
   "mobile.message": {
    "en": "Scanning! You can now go back to the website using the upper left arrow.",
    "de": "Scanvorgang läuft! Nutze den Pfeil links oben um zurück zur Website zu gelangen."
  }

}

let browser = (typeof chrome !== 'undefined') ? chrome : browser;

let mobile = navigator.userAgent.toLowerCase().includes("android");


function scaleStandalone()
{

    if (mobile)

    {

    const h1Elements = document.querySelectorAll('h1');
    h1Elements.forEach(h1 => {
        h1.style.fontSize = '80px';
    });

    const dropdown = document.getElementById('dropdown');
    if (dropdown) {
        dropdown.style.padding = '40px';
        dropdown.style.fontSize = '64px';
    }

    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.style.padding = '20px 80px';
        button.style.fontSize = '64px';
    });

    const sliders = document.querySelectorAll('.slider');
    sliders.forEach(slider => {
        slider.style.width = '100%';
    });

    const sliderValue = document.getElementById('slider-value');
    if (sliderValue) {
        sliderValue.style.fontSize = '64px';
    }

    const sliderName = document.getElementById('slider-name');
    if (sliderName) {
        sliderName.style.fontSize = '64px';
    }

   }
}

function translatePopUp (language)
{
    document.getElementById("detect-bias").innerHTML = translations["button.detect"][language];
    document.getElementById("slider-name").innerHTML = translations["slider.strength"][language];
}

async function loadLanguage() {

    result = await browser.storage.local.get("bias_scanner_language");

    if (result.bias_scanner_language) {

        if (document.getElementById("dropdown").value != result.bias_scanner_language) {
            document.getElementById("dropdown").value = result.bias_scanner_language;
        }

        languageSelected();

    } else {
        browser.storage.local.set({ "bias_scanner_language": "en" });
    }
}

async function loadClicks() {

    result = await browser.storage.local.get("bias_scanner_clicked");

  if (!result.bias_scanner_clicked)
  {
   browser.storage.local.set({ "bias_scanner_clicked": 0 });
  }

}

async function loadSlider() {

    result = await browser.storage.local.get("bias_scanner_strength");

    if (document.getElementById("sensitivity-slider").value != result.bias_scanner_strength) {
            document.getElementById("sensitivity-slider").value = result.bias_scanner_strength;
        }


    sensitivityMoved();

  if (!result.bias_scanner_strength)
  {
   browser.storage.local.set({ "bias_scanner_strength": 0.1 });
  }


}



async function buttonClicked()
{
     console.log("Button in popup clicked!");


    result = await browser.storage.local.get("bias_scanner_clicked");
    bias_scanner_clicked = result.bias_scanner_clicked

    bias_scanner_clicked++;
    browser.storage.local.set({ "bias_scanner_clicked": bias_scanner_clicked });
    console.log(bias_scanner_clicked)

    // Get the current active tab ID
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTabId = tabs[0].id;

      // Send a message to the background script with the action and tab ID
      chrome.runtime.sendMessage({ action: "buttonClicked", tabId: currentTabId }, function(response) {
        console.log("Message sent to background script");
      });
    });

    if (mobile)
    {
        let selectedLanguage = document.getElementById("dropdown").value;
        document.getElementById("detect-bias").disabled = true;
        document.getElementById("detect-bias").innerText = translations["mobile.message"][selectedLanguage];
         document.getElementById("detect-bias").style.backgroundColor = "#A9A9A9";

         document.body.style.padding = '40px';

   }

}


function languageSelected()
{

   // Get the selected language from the dropdown
    let selectedLanguage = document.getElementById("dropdown").value;

    translatePopUp(selectedLanguage);

    // Update the storage with the selected language
    browser.storage.local.set({ "bias_scanner_language": selectedLanguage });

    console.log("Language updated to:", selectedLanguage);

}


function sensitivityMoved()
{
  document.getElementById('slider-value').textContent = document.getElementById("sensitivity-slider").value;
  //document.getElementById('slider-value').style.right = 100 - document.getElementById("sensitivity-slider").value * 90 + "%"
  document.getElementById('slider-value').style.right = 61.111 - document.getElementById("sensitivity-slider").value * 111.111 + "%"
  console.log(document.getElementById('slider-value').style.right);

  browser.storage.local.set({ "bias_scanner_strength": document.getElementById("sensitivity-slider").value });

}


document.addEventListener("DOMContentLoaded", async function() {

  // Your popup initialization code here

    await loadLanguage();

    await loadSlider();

    await loadClicks();

    scaleStandalone();

     // Example: Handle a button click within the popup
   document.getElementById("detect-bias").addEventListener("click", buttonClicked);

  // Handle dropdown change event
  document.getElementById("dropdown").addEventListener("change", languageSelected);


document.getElementById("sensitivity-slider").addEventListener('input', sensitivityMoved);

});

;


