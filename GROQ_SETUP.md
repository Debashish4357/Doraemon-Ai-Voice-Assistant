# 🚀 Groq LLM Setup Guide

Your Doraemon Voice Agent now supports **two modes**:

## 🎯 Modes

### 1. **Rule-Based Mode** (Default)
- ✅ Works out of the box
- ✅ No API key needed
- ✅ Fast pattern matching
- ⚠️ Limited to predefined patterns

### 2. **LLM-Powered Mode** (Aether-style)
- ✅ Intelligent intent detection
- ✅ Natural language understanding
- ✅ Context-aware responses
- ✅ Automatic tool calling
- 🔑 Requires Groq API key (FREE)

---

## 🔧 Enable LLM Mode

### Step 1: Get Groq API Key (FREE)

1. Go to: https://console.groq.com/keys
2. Sign up (free account)
3. Click "Create API Key"
4. Copy your key

### Step 2: Configure Backend

Create `backend/.env` file:

```bash
GROQ_API_KEY=gsk_your_key_here
```

### Step 3: Install Dependencies

```bash
cd backend
pip install groq
```

Or reinstall all:

```bash
pip install -r requirements.txt
```

### Step 4: Restart Backend

```bash
# Stop the current backend (Ctrl+C)
# Then restart:
uvicorn main:app --reload
```

### Step 5: Verify

Open the frontend and check the header. It should say:
- **"LLM Mode (Groq)"** ✅ if configured correctly
- **"Rule-Based Mode"** if no API key

---

## 🎤 Test LLM Mode

Try these natural language commands:

```
"I need to buy groceries tomorrow"
→ LLM automatically creates task

"What do I need to do?"
→ LLM lists tasks

"I'm done with buying groceries"
→ LLM finds and deletes the task

"My birthday is June 15th"
→ LLM stores in memory

"What do you know about me?"
→ LLM recalls memories
```

---

## 🆚 Comparison

| Feature | Rule-Based | LLM-Powered |
|---------|------------|-------------|
| Setup | ✅ Instant | 🔑 Needs API key |
| Speed | ⚡ Very fast | ⚡ Fast (Groq LPU) |
| Understanding | 📋 Exact patterns | 🧠 Natural language |
| Context | ❌ No | ✅ Yes |
| Flexibility | ⚠️ Limited | ✅ High |
| Cost | 💰 Free | 💰 Free (generous limits) |

---

## 🔥 Groq Benefits

- **Lightning Fast**: Groq LPU inference (faster than GPT-4)
- **Free Tier**: 30 requests/minute, 14,400/day
- **Smart Models**: Llama-3.3-70b, Mixtral-8x7b
- **Function Calling**: Native tool integration

---

## 🐛 Troubleshooting

### "GROQ_API_KEY not found"
- Check `.env` file exists in `backend/` folder
- Verify key format: `GROQ_API_KEY=gsk_...`
- Restart backend after adding key

### "LLM Mode Error, falling back to rule-based"
- Check API key is valid
- Check internet connection
- Check Groq API status: https://status.groq.com

### Frontend still shows "Rule-Based Mode"
- Hard refresh browser (Ctrl+Shift+R)
- Check backend console for errors
- Verify `/agent/mode` endpoint returns `llm_powered: true`

---

## 📊 API Usage

Check your usage at: https://console.groq.com/usage

Free tier limits:
- **30 requests/minute**
- **14,400 requests/day**
- **Unlimited** for personal projects

---

## 🎯 Recommendation

**For best experience**: Use **LLM Mode**

It provides:
- Natural conversation flow
- Intelligent intent detection
- Context awareness
- Better user experience

**Rule-Based Mode** is great for:
- Offline usage
- No API dependency
- Maximum privacy
- Predictable behavior

---

## 🔄 Switch Modes

The system automatically uses LLM mode if `GROQ_API_KEY` is set.

To force rule-based mode:
1. Remove or comment out `GROQ_API_KEY` in `.env`
2. Restart backend

---

## 🎉 You're Ready!

Your Doraemon agent now has Aether-level intelligence! 🚀

**Next**: Say "Hello" and start talking naturally!
