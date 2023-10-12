#=============================================================================
# "app.py"
#
# Web service that analyzes a text file for biases using OpenAI's ChatGPT
# model
#
# Part of Bias-Scanner, a system to strengthen democracy by supporting
# critical reading online
#
# Developed by the Information Access Research Group (Professor J.L. Leidner),
# Coburg University of Applied Sciences, Coburg, Bavaria, Germany.
# Copyright (C)2023 by Dr. Jochen L. Leidner. All Rights reserved.
#=============================================================================

import requests, os
from flask import Flask, render_template, request


app = Flask(__name__)
chat_log = ""

# OpenAI Inc.'s ChatGPT REST API endpoint
CHATGPT_API_ENDPOINT = "https://api.openai.com/v1/chat/completions"

# OpenAI API key
key = os.environ.get("BIAS_SCANNER_API")
OPENAI_API_KEY = key
if len(key) > 0:
    print("API key found")

def generate_chat_response(message, chat_log):
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    data = {
        "model": "gpt-3.5-turbo",
        "messages": chat_log + [{"role": "system", "content": message}]
    }
    response = requests.post(CHATGPT_API_ENDPOINT, headers=headers, json=data)
    response_data = response.json()

    chat_result = response_data["choices"][0]["message"]["content"]
    return chat_result

@app.route("/", methods=["GET", "POST"])
def chat_page():
    if request.method == "POST":
       message = request.form["message"]
       chat_log = request.form.getlist("chat_log[]")
       response = generate_chat_response(message, chat_log)
       chat_log.append({"role": "user", "content": message})
       chat_log.append({"role": "assistant", "content": response})
    else:
        # Initial chat log (first time is HTTP-GET request)
        chat_log = [{"role": "system",
                     "content": "You are connected to Bias-Scanner. Chat away!"}]
    return render_template("index.html", chat_log=chat_log)

if __name__ == "__main__":
    app.run(debug=True)

#=============================================================================
# end of file "app.py"
#=============================================================================
