import bot from './assets/bot.svg';
import user from './assets/user.svg';

const API_KEY = process.env.OPENAI_API_KEY;
const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

let loadInterval;
let isFetching = false; // Variable para controlar si se está realizando una solicitud

function loader(element) {
  element.textContent = '';

  loadInterval = setInterval(() => {
    element.textContent += '.';

    if (element.textContent === '...') {
      element.textContent = '';
    }
  }, 300);
}

function typeText(element, text) {
  let index = 0;

  let interval = setInterval(() => {
    if (index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 20);
}

function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAi, value, uniqueId) {
  return `
    <div class="wrapper ${isAi ? 'ai' : ''}">
        <div class="chat">
            <div class="profile">
                <img 
                  src=${isAi ? bot : user} 
                  alt="${isAi ? 'bot' : 'user'}" 
                />
            </div>
            <div class="message" id=${uniqueId}>${value}</div>
        </div>
    </div>
  `;
}

const handleSubmit = async (e) => {
  e.preventDefault();

  if (isFetching) {
    return; // Evita realizar múltiples solicitudes simultáneas
  }

  const data = new FormData(form);
  const userPrompt = data.get('prompt').trim();

  if (!userPrompt) {
    return; // Evita enviar solicitudes vacías
  }

  // user's chat stripe
  chatContainer.innerHTML += chatStripe(false, userPrompt);

  // to clear the textarea input 
  form.reset();

  // bot's chat stripe
  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStripe(true, '', uniqueId);

  // to focus scroll to the bottom 
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // specific message div 
  const messageDiv = document.getElementById(uniqueId);

  loader(messageDiv);
  isFetching = true; // Indica que se está realizando una solicitud

  try {
    const response = await fetch('https://automated-ai.onrender.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        prompt: userPrompt
      })
    });

    clearInterval(loadInterval);
    messageDiv.innerHTML = '';

    if (response.ok) {
      const responseData = await response.json();
      const botResponse = responseData.bot.trim();

      typeText(messageDiv, botResponse);
    } else {
      throw new Error('Request failed'); // Lanzar un error si la solicitud no es exitosa
    }
  } catch (error) {
    messageDiv.innerHTML = 'Something went wrong';
    console.error(error);
  } finally {
    isFetching = false; // Reinicia la variable isFetching después
  }

  form.addEventListener('submit', handleSubmit)
  form.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
      handleSubmit(e)
    }
  })
}