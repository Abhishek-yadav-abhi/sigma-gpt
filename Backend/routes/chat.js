import express from "express";
import Thread from "../models/Thread.js";
import getOpenAIAPIResponse from "../utils/openai.js";

const router = express.Router();
// CHANGE: provide temporary thread storage when MongoDB is unavailable.
const inMemoryThreads = new Map();

// CHANGE: keep chat functional when MongoDB is temporarily unreachable.
const databaseIsReady = () => Thread.db.readyState === 1;

//test
router.post("/test", async(req, res) => {
    try {
        const thread = new Thread({
            threadId: "abc",
            title: "Testing New Thread2"
        });

        const response = await thread.save();
        res.send(response);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to save in DB"});
    }
});
//Get all threads
router.get("/thread", async(req, res) => {
    try {
        // CHANGE: read from MongoDB when connected; otherwise use the fallback store.
        const threads = databaseIsReady()
            ? await Thread.find({}).sort({updatedAt: -1})
            : [...inMemoryThreads.values()].sort((a, b) => b.updatedAt - a.updatedAt);
        //descending order of updatedAt...most recent data on top
        res.json(threads);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to fetch threads"});
    }
});

router.get("/thread/:threadId", async(req, res) => {
    const {threadId} = req.params;

    try {
        // CHANGE: retrieve a thread from the available storage backend.
        const thread = databaseIsReady()
            ? await Thread.findOne({threadId})
            : inMemoryThreads.get(threadId);

        if(!thread) {
            return res.status(404).json({error: "Thread not found"});
        }

        res.json(thread.messages);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to fetch chat"});
    }
});

router.delete("/thread/:threadId", async (req, res) => {
    const {threadId} = req.params;

    try {
        // CHANGE: delete from MongoDB or the fallback store, as appropriate.
        const deletedThread = databaseIsReady()
            ? await Thread.findOneAndDelete({threadId})
            : inMemoryThreads.get(threadId);

        if (!databaseIsReady()) inMemoryThreads.delete(threadId);

        if(!deletedThread) {
            return res.status(404).json({error: "Thread not found"});
        }

        res.status(200).json({success : "Thread deleted successfully"});

    } catch(err) {
        console.log(err);
        res.status(500).json({error: "Failed to delete thread"});
    }
});

router.post("/chat", async(req, res) => {
    const {threadId, message} = req.body;

    if(!threadId || !message) {
        return res.status(400).json({error: "missing required fields"});
    }

    try {
        // CHANGE: continue the thread from the available persistent or fallback store.
        let thread = databaseIsReady()
            ? await Thread.findOne({threadId})
            : inMemoryThreads.get(threadId);

        if(!thread) {
            //create a new thread in Db
            const threadData = {
                threadId,
                title: message,
                messages: [{role: "user", content: message}],
                createdAt: new Date(),
                updatedAt: new Date()
            };
            thread = databaseIsReady() ? new Thread(threadData) : threadData;
        } else {
            thread.messages.push({role: "user", content: message});
        }

        // CHANGE: generate the assistant response before saving the completed turn.
        const assistantReply = await getOpenAIAPIResponse(message);

        thread.messages.push({role: "assistant", content: assistantReply});
        thread.updatedAt = new Date();

        // CHANGE: persist the completed turn to the storage backend in use.
        if (databaseIsReady()) {
            await thread.save();
        } else {
            inMemoryThreads.set(threadId, thread);
        }
        res.json({reply: assistantReply});
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "something went wrong"});
    }
});

export default router;
