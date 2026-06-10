const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const keyMatch = env.match(/GEMINI_API_KEY="?([^"\n]+)"?/);
const key = keyMatch ? keyMatch[1].trim() : '';

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
  .then(res => res.json())
  .then(data => {
    if (data.models) {
      console.log(data.models.map(m => m.name).join('\n'));
    } else {
      console.log('Error:', data);
    }
  })
  .catch(err => console.error(err));
