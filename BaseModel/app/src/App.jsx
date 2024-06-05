import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css'
import {MainContainer, ChatContainer, Message, MessageList, MessageInput, TypingIndicator} from "@chatscope/chat-ui-kit-react"
import questions from './questions.json';
const API_KEY = "YOUR_API_KEY_HERE"

function App() {
  const [messages, setMessages] = useState([
    {
      message: "Hi! How are you doing today?",
      sender: "assistant"
    }
  ])
  const [isTyping, setIsTyping] = useState(false) // simulate typing from the bot
  const [surveyActive, setSurveyActive] = useState(false); // tracks if we are currently in the survey
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [category, setCategory] = useState(Object.keys(questions)[0]); // Wellness, Extracurriculers, Oncology, Other

  useEffect(() => {
    if (surveyActive) {
      askSurveyQuestion();
    } 
  }, [surveyActive, currentQuestionIndex]);

  const askSurveyQuestion = () => {
    console.log(category)
    if (category && questions[category].length > currentQuestionIndex) {
      setIsTyping(true);
      setTimeout(() => { // Simulate typing delay
        setMessages(prev => [...prev, { message: questions[category][currentQuestionIndex].Q, sender: "assistant" }]);
        setIsTyping(false);
      }, 1000);
    } else {
      endSurvey();
    }
  };

  const endSurvey = () => {
    setSurveyActive(false);
    setCurrentQuestionIndex(0);
    setCategory(Object.keys(questions)[0]);
    setMessages(prev => [...prev, { message: "Awesome! We are all done with the survey", sender: "assistant" }]);
  };

  const handleSend = async (message) => {
    //set up new message
    const newMessage = {
      message: message,
      direction: 'outgoing',
      sender: "user"
    };

    // add new message to list of messages
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);

    var str = message.trim().toLowerCase()
    // if the last message includes "survey" and the user responds "yes", 
    if (((str).includes("yes") || (str).includes("yep") || ((str).includes("yeah") && !(str).includes("yeah no")) || (str).includes("yup")) && !surveyActive && messages[messages.length - 1].message.includes("survey")) { 
      setSurveyActive(true);
    } else if (!surveyActive) {
      setIsTyping(true);
      await processMessageToChatGPT(newMessages);
    } else {
      // Proceed to next survey question
      if (category && questions[category].length - 1 > currentQuestionIndex) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      } else if (category && questions[category].length - 1 == currentQuestionIndex) {
        setCategory(Object.keys(questions)[categoryIndex + 1]) // categoryIndex is not yet updated
        setCategoryIndex(categoryIndex + 1);
        setCurrentQuestionIndex(0)
      }
    }
  };

  async function processMessageToChatGPT(chatMessages) { 
    // Format messages for chatGPT API: { role: "user" or "assistant", "content": "message here"}
    let apiMessages = chatMessages.map((messageObject) => {
      let role = messageObject.sender;
      return { role: role, content: messageObject.message}
    });

    // initial message determining chatbot's personality
    const systemMessage = {
      role: "system",
      content: "Play the role of a friend for pediatric patients who eagerly checks on their daily life and wellness. Please keep your responses short and child-friendly and do not make any health recommendations. After a few messages please ask if the user wants to start the survey"
    }

    // Get the request body set up with the model we plan to use
    const apiRequestBody = {
      "model": "gpt-4-turbo-preview",
      "messages": [
        systemMessage, // initial message
        ...apiMessages // messages from the conversation
      ]
    }

    await fetch("https://api.openai.com/v1/chat/completions", 
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(apiRequestBody)
    }).then((data) => {
      return data.json();
    }).then((data) => {
      console.log(data);
      setMessages([...chatMessages, {
        message: data.choices[0].message.content,
        sender: "assistant"
      }]);
      setIsTyping(false);
    });
  }

  return (
    <div>
      <div style={{ position:"relative", height: "800px", width: "700px"  }}>
        <MainContainer>
          <ChatContainer >       
            <MessageList 
              scrollBehavior="smooth" 
              typingIndicator={isTyping ? <TypingIndicator content="OCAYBot is typing" /> : null}
              style={{ color:"#bfb1be"}}
            >
              {messages.map((message, i) => {
                return <Message key={i} model={message} />
              })}
            </MessageList>
            <MessageInput placeholder="Type here..." onSend={handleSend} />        
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  )
}

export default App