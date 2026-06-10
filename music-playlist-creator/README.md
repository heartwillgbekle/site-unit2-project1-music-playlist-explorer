# Music Playlist Explorer - API Setup

## 🔑 Setting Up Your API Key

Your API key is kept in a separate file that **won't be committed to Git**.

### Setup Steps:

1. **config.js already exists** with your current key
2. This file is **automatically gitignored** (won't be committed)
3. If you need to share this project:
   - Share `config.example.js` (which has placeholder)
   - Others copy it to `config.js` and add their own key

### How It Works:

```
index.html
  ↓
  Loads config.js first  ← Your API key lives here (gitignored)
  ↓
  Loads script.js        ← Uses API_KEY from config.js
```

## 📁 Files:

- **config.js** - Your actual API key (gitignored, NOT committed)
- **config.example.js** - Example template (committed to Git)
- **script.js** - Main app code (uses API_KEY from config.js)

## 🔒 Security:

✅ **config.js is gitignored** - Your key won't be committed  
✅ **config.example.js is tracked** - Others know what to create  
✅ **No prompts needed** - Key loads automatically  
✅ **Works offline** - No .env file needed  

## 🎯 For Collaborators:

If someone clones this repo:

1. They'll see `config.example.js`
2. Copy it: `cp config.example.js config.js`
3. Edit `config.js` and add their own API key
4. Done! App works immediately

## 🌐 Getting an API Key:

1. Visit [https://openrouter.ai](https://openrouter.ai)
2. Sign up (free)
3. Create an API key
4. Copy to `config.js`

The **Gemma model is completely free** - no credit card needed!

---

**Your key is safe** - it's in a gitignored file and won't be shared publicly.
