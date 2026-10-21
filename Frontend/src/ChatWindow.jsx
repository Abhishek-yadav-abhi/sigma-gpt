import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect } from "react";
import {ScaleLoader} from "react-spinners";

// CHANGE: use the freshly started backend instance.
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function ChatWindow() {
    const {prompt, setPrompt, reply, setReply, currThreadId, setPrevChats, setNewChat} = useContext(MyContext);
    // CHANGE: prevent duplicate sends and show a loader while the API responds.
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const getReply = async () => {
        const message = prompt.trim();
        if (!message || loading) return;

        setLoading(true);
        setNewChat(false);
        // CHANGE: clear the input only after Send, never on every keystroke.
        setPrompt("");
        // CHANGE: show the user's message immediately instead of waiting for Gemini's reply.
        setPrevChats(prevChats => [...prevChats, {
            role: "user",
            content: message,
            timestamp: Date.now()
        }]);
        // CHANGE: cancel a stalled request cleanly after the configured timeout.
        const controller = new AbortController();
        // CHANGE: allow slower responses to finish instead of aborting after 20 seconds.
        const timeoutId = setTimeout(() => controller.abort(), 90000);

        console.log("message ", message, " threadId ", currThreadId);
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message,
                threadId: currThreadId
            }),
            // CHANGE: attach the cancellation signal to this API request.
            signal: controller.signal
        };

        try {
            const response = await fetch(`${API_URL}/chat`, options);
            const res = await response.json();
            if (!response.ok) throw new Error(res.error || "Unable to get a reply");
            console.log(res);
            setReply(res.reply);
        } catch(err) {
            // CHANGE: display API failures in the chat instead of silently leaving it loading.
            const message = err.name === "AbortError"
                ? "Response timed out. Please try again."
                : `Error: ${err.message}`;
            setReply(message);
        }
        // CHANGE: release the timeout after either a successful or failed request.
        clearTimeout(timeoutId);
        setLoading(false);
    }

    //Append new chat to prevChats
    useEffect(() => {
        if(reply) {
            setPrevChats(prevChats => (
                [...prevChats, {
                    role: "assistant",
                    content: reply,
                    timestamp: Date.now()
                }]
            ));
        }
    }, [reply, setPrevChats]);


    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    }

    return (
        <div className="chatWindow">
            <div className="navbar">
                <span>SigmaGPT <i className="fa-solid fa-chevron-down"></i></span>
                <div className="userIconDiv" onClick={handleProfileClick}>
                    <span className="userIcon"><i className="fa-solid fa-user"></i></span>
                </div>
            </div>
            {
                isOpen && 
                <div className="dropDown">
                    {/* CHANGE: React uses className instead of the HTML class attribute. */}
                    <div className="dropDownItem"><i className="fa-solid fa-gear"></i> Settings</div>
                    <div className="dropDownItem"><i className="fa-solid fa-cloud-arrow-up"></i> Upgrade plan</div>
                    <div className="dropDownItem"><i className="fa-solid fa-arrow-right-from-bracket"></i> Log out</div>
                </div>
            }
            <Chat></Chat>

            {loading && <ScaleLoader color="#fff" loading />}
            
            <div className="chatInput">
                <div className="inputBox">
                    <input
                        type="text"
                        placeholder="Ask anything"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && getReply()}
                        autoFocus
                    />
                    <button id="submit" type="button" onClick={getReply} aria-label="Send message"><i className="fa-solid fa-paper-plane"></i></button>
                </div>
                <p className="info">
                    SigmaGPT can make mistakes. Check important info. See Cookie Preferences.
                </p>
            </div>
        </div>
    )
}

export default ChatWindow;
