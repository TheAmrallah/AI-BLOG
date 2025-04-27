let currentCategory = '1';
let apiKey = localStorage.getItem('gemini_api_key') || '';

document.addEventListener('DOMContentLoaded', () => {
    // Set up category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            document.getElementById('customTopic').classList.toggle('hidden', currentCategory !== '4');
        });
    });
    
    if(apiKey) toggleMainUI();
});

function saveAPIKey() {
    apiKey = document.getElementById('apiKey').value.trim();
    if(!apiKey) {
        alert('Please enter a valid API key');
        return;
    }
    localStorage.setItem('gemini_api_key', apiKey);
    toggleMainUI();
}

function toggleMainUI() {
    document.getElementById('apiSection').classList.add('hidden');
    document.getElementById('mainUI').classList.remove('hidden');
}

function toggleAPIKey() {
    document.getElementById('apiSection').classList.remove('hidden');
    document.getElementById('mainUI').classList.add('hidden');
}

async function generateArticles() {
    const count = parseInt(document.getElementById('articleCount').value) || 1;
    const topic = currentCategory === '4' 
        ? document.getElementById('customTopic').value.trim()
        : getDefaultTopic();

    if(!validateInputs(topic, count)) return;

    try {
        updateStatus(`Generating ${count} articles... ⏳`);
        const zip = new JSZip();
        
        // Add progress indicator
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress++;
            updateStatus(`Generating articles... ${progress}%`);
        }, 300);
        
        for(let i = 0; i < count; i++) {
            const content = await fetchArticle(topic);
            zip.file(`Article_${i+1}.txt`, content);
            
            // Update real progress
            const realProgress = Math.floor(((i+1)/count)*100);
            progress = Math.min(progress, realProgress);
        }
        
        clearInterval(progressInterval);
        updateStatus(`Preparing download file...`);
        
        const zipContent = await zip.generateAsync({type: 'blob'});
        downloadZip(zipContent);
        
        updateStatus(`Successfully generated ${count} articles! ✅`);
    } catch(error) {
        updateStatus(`Error: ${error.message}`);
    }
}

function validateInputs(topic, count) {
    if(!apiKey) {
        alert('Please enter your API key first');
        toggleAPIKey();
        return false;
    }
    if(count < 1 || count > 1000) {
        alert('Please enter a number between 1 and 1000');
        return false;
    }
    if(!topic) {
        alert('Please enter an article topic');
        return false;
    }
    return true;
}

async function fetchArticle(topic) {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: generatePrompt(topic)
                }]
            }]
        })
    });

    if(!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to connect to server');
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

function generatePrompt(topic) {
    const prompts = {
        '1': `Write a comprehensive sports article about ${topic} including:
- Historical background
- Recent statistics
- Expert opinions
- Future predictions
Use professional and well-structured English language`,
        
        '2': `Write a detailed food recipe for ${topic} including:
- Precise ingredients list
- Numbered preparation steps
- Required time
- Nutritional information
- Serving suggestions
Use clear and concise English language`,
        
        '3': `Write a complete travel guide about ${topic} including:
- Location and best times to visit
- Main attractions
- Accommodation options
- Local restaurants
- Travel tips
Use engaging and descriptive English language`,
        
        '4': `Write a comprehensive article about ${topic} including:
- Clear introduction
- Well-organized content
- Concise conclusion
- References if available
Use professional and formal English language`
    };
    return prompts[currentCategory];
}

function downloadZip(content) {
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Articles_${new Date().toLocaleDateString()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Free memory after 1 second
    setTimeout(() => {
        window.URL.revokeObjectURL(url);
    }, 1000);
}

function getDefaultTopic() {
    const topics = {
        '1': 'The best sports clubs in the Middle East',
        '2': 'Traditional holiday cookie recipe',
        '3': 'The most beautiful tourist cities in the Gulf region'
    };
    return topics[currentCategory];
}

function updateStatus(message) {
    document.getElementById('statusBar').textContent = message;
}
