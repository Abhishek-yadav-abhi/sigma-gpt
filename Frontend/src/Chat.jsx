import "./Chat.css";
import React, { useContext, useState, useEffect } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function TypingReply({ reply }) {
    const [visibleReply, setVisibleReply] = useState("");

    useEffect(() => {
        const words = reply.split(" ");
        let index = 0;
        const interval = setInterval(() => {
            index += 1;
            setVisibleReply(words.slice(0, index).join(" "));
            if (index >= words.length) clearInterval(interval);
        }, 40);

        return () => clearInterval(interval);
    }, [reply]);

    return <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{visibleReply}</ReactMarkdown>;
}

function Chat() {
    const {newChat, prevChats, reply} = useContext(MyContext);

    return (
        <>
            {newChat && <h1>Start a New Chat!</h1>}
            <div className="chats">
                {prevChats?.map((chat, index) => {
                    const isTypingLatestReply =
                        chat.role === "assistant" &&
                        index === prevChats.length - 1 &&
                        reply !== null;

                    return (
                        <div className={chat.role === "user" ? "userDiv" : "gptDiv"} key={`${chat.timestamp ?? index}-${chat.role}`}>
                            {chat.role === "user" ? (
                                // CHANGE: render every user message instead of hiding it behind the latest-reply logic.
                                <p className="userMessage">{chat.content}</p>
                            ) : isTypingLatestReply ? (
                                <TypingReply key={reply} reply={reply} />
                            ) : (
                                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{chat.content}</ReactMarkdown>
                            )}
                        </div>
                    );
                })}

            </div>
        </>
    )
}

export default Chat;
