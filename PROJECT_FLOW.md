# RankPilot: Project Flow & Architecture (Hinglish)

Ye document RankPilot system ka end-to-end working flow samjhata hai. Isme Frontend, Backend, Database, aur AI Agent ke beech ka coordination clear kiya gaya hai.

## 1. High-Level Architecture
System 4 main layers mein divided hai:
1.  **Frontend (React + Vite)**: User interface aur session handling.
2.  **Backend API (FastAPI)**: Routes, validation, aur streaming logic.
3.  **Business Logic (Services & Repository)**: Database CRUD aur Agent orchestration.
4.  **AI Layer (Agno + PostgreSQL Memory)**: Tool usage aur contextual retrieval.

---

## 2. Request Flow (End-to-End)

### Step A: Message Bhejna (Frontend)
- User input field mein message type karke 'Send' click karta hai.
- `App.jsx` mein `handleSendMessage` function trigger hota hai.
- **Isolation Check**: Frontend pehle hi current `chatId` ko lock kar leta hai takay agar user dusre chat pe switch kare, toh response usi purani chat mein hi update ho.
- Backend ke `/api/chat/stream` endpoint pe request jaati hai.

### Step B: Connection & Session Handling (Backend Router)
- `routers/chat.py` request receive karta hai.
- `ChatService` ko call kiya jata hai.
- Agar `session_id` missing hai, toh ek naya UUID create hota hai aur title set hota hai.
- User ka message PostgreSQL DB (`chat_messages` table) mein save hota hai.

### Step C: Agent Initialization (Agent Factory)
- `ChatService` call karta hai `get_content_agent(session_id)` function ko.
- **Factory Pattern**: Ye function har request ke liye ek fresh Agent object banata hai.
- **Memory Loading**: Agno library automatic PostgreSQL (`agent_sessions` table) se pichle 5 runs ka context utha leti hai.
- Agent ko saare tools (Search, Deploy, ImgBB) assigned hote hain.

### Step D: Execution & Streaming (Processing)
- Agent process start karta hai. Agar koi information missing hai (e.g. current news), toh wo `DuckDuckGoToolkit` use karke search karta hai.
- **SSE Events**: Har progress (Tool start, Tool end, Tokens) frontend ko Server-Sent Events (SSE) ke through bheji jati hai.
- `isSearching` status frontend pe 'Searching DuckDuckGo...' indicator trigger karta hai.

### Step E: Persistence & Cleanup (Completion)
- Jab AI response complete ho jata hai, toh pura message `chat_messages` table mein save hota hai.
- Frontend ko `event: done` ka signal milta hai.
- Sidebar refresh hota hai aur loading states reset ho jati hain.

---

## 3. Key Technical Features (Hinglish Explained)

### 🚀 ChatGPT-Style Isolation
- **Backend**: `stateless` agents reuse nahi hote, isliye data leak nahi hota.
- **Frontend**: `targetSessionId` variable use karke streaming response ko restricted rakha jata hai. Agar aap Chat-A se message bhej kar Chat-B pe chale jao, toh Chat-A ka response background mein chalta rahega par Chat-B ko disturb nahi karega.

### 💾 Persistent Memory
- Hum sirf messages save nahi kar rahe, balki Agent ki 'Internal Mental State' (Memory) ko bhi PostgreSQL mein store kar rahe hain. 
- Iska fayda ye hai ke application restart hone ke baad bhi AI ko yaad rehta hai ke pichli baar kya baat hui thi.

### 🔍 Production-Grade UI
- Search indicators simple text nahi hain balki animated pulse indicators hain jo `MessageList.jsx` ke andar integrate kiye gaye hain.
- "Two Icons" bug fix: Avatar aur searching status ko merge kiya gaya hai takay clean UI dikhe.

---

## 4. Directory Structure Map
- `frontend/src/App.jsx`: Main UI Controller.
- `backend/content_agent.py`: AI Brain & Tool Registry.
- `backend/services/chat_service.py`: Orchestrator (Logic coordinator).
- `backend/database/repository.py`: DB query handler.
- `backend/routers/chat.py`: API Gateway.
