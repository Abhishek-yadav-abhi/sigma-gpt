import "./Sidebar.css";
import { useCallback, useContext, useEffect } from "react";
import { MyContext } from "./MyContext.jsx";
import {v1 as uuidv1} from "uuid";
import logo from "./assets/blacklogo.png";

// CHANGE: point sidebar thread requests to the active backend API.
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function Sidebar() {
    const {allThreads, setAllThreads, currThreadId, setNewChat, setPrompt, setReply, setCurrThreadId, setPrevChats} = useContext(MyContext);

    // CHANGE: load saved conversations so they can be selected from the sidebar.
    const getAllThreads = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/thread`);
            const res = await response.json();
            const filteredData = res.map(thread => ({threadId: thread.threadId, title: thread.title}));
            //console.log(filteredData);
            setAllThreads(filteredData);
        } catch(err) {
            console.log(err);
        }
    }, [setAllThreads]);

    useEffect(() => {
        getAllThreads();
    }, [currThreadId, getAllThreads])


    // CHANGE: reset shared chat state and create a fresh ID for a new conversation.
    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
    }

    // CHANGE: fetch and display the messages belonging to the selected thread.
    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId);

        try {
            const response = await fetch(`${API_URL}/thread/${newThreadId}`);
            const res = await response.json();
            console.log(res);
            setPrevChats(res);
            setNewChat(false);
            setReply(null);
        } catch(err) {
            console.log(err);
        }
    }   

    // CHANGE: remove a saved conversation from both the backend and sidebar.
    const deleteThread = async (threadId) => {
        try {
            const response = await fetch(`${API_URL}/thread/${threadId}`, {method: "DELETE"});
            const res = await response.json();
            console.log(res);

            //updated threads re-render
            setAllThreads(prev => prev.filter(thread => thread.threadId !== threadId));

            if(threadId === currThreadId) {
                createNewChat();
            }

        } catch(err) {
            console.log(err);
        }
    }

    return (
        <section className="sidebar">
            <button onClick={createNewChat}>
                <img src={logo} alt="SigmaGPT logo" className="logo" />
                <span><i className="fa-solid fa-pen-to-square"></i></span>
            </button>

            {/* CHANGE: label the saved conversation list like ChatGPT's Recents section. */}
            <div className="recentChats">
                <p className="recentTitle">Recents</p>
                <ul className="history">
                    {
                        allThreads?.map((thread, idx) => (
                            <li key={idx} 
                                onClick={() => changeThread(thread.threadId)}
                                className={thread.threadId === currThreadId ? "highlighted": " "}
                            >
                                {thread.title}
                                <i className="fa-solid fa-trash"
                                    onClick={(e) => {
                                        e.stopPropagation(); //stop event bubbling
                                        deleteThread(thread.threadId);
                                    }}
                                ></i>
                            </li>
                        ))
                    }
                </ul>
            </div>
 
            <div className="sign">
                <p>By Abhishek &hearts;</p>
            </div>
        </section>
    )
}

export default Sidebar;
