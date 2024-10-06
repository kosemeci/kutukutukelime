document.addEventListener("DOMContentLoaded", function () {
    const topFace = document.getElementById("top");
    const answerSection = document.getElementById("answer-section");
    const containerBoxes = document.getElementById("container-boxes");
    const questionText = document.getElementById("questionText");
    const userAnswer = document.getElementById("userAnswer");
    const submitAnswerButton = document.getElementById("submitAnswer");
    const answerText = document.getElementById("answerText");
    const resultContainer = document.getElementById('result-container');
    const resultList = document.getElementById('resultList');
    const newGameButtonRes = document.getElementById('newGameButtonRes');
    const shareCard = document.getElementById('shareCard');
    const homeButtonRes = document.getElementById('homeButtonRes');
    const progressContainer = document.querySelector('.progress-container');
    const speakButton = document.getElementById('speakButton');
    
    document.getElementById('box').classList.add('shake');
    submitAnswerButton.disabled = true ;

    var words = [];
    const red_color = "#E74C3C";
    const green_color = "#2ECC71";
    let currentWord = null;
    let askEnglish = true;
    let correctNum = 0;
    let ask_index = 0;
    let ask_line = 10;
    let progress = 0;
    let randomWords = [];
    var isMuted = false;

    const url_fetch = `${window.location.pathname}`;
    fetch(`/fetch${url_fetch}`)
    .then(response => response.json())
    .then(get_words => {
        words.push(...get_words);
    })
    .catch(error => console.error('Error:', error));
    function showGameResult(correctAnswers, totalQuestions) {
        const point = ((correctAnswers / totalQuestions) * 100).toFixed(2);
        let resultMessage = `
            <div style="text-align: center;">
                <h2>Oyun bitti!</h2>
                <h3 class="yellow-color">Başarı Oranı: ${point}%</h3>
            </div>`;
        containerBoxes.style.display = 'none';
        resultContainer.style.display ='block';
        document.getElementById("resultMessageGame").innerHTML = resultMessage;
        document.getElementById("action-buttons").style.display = "block";
    }
    newGameButtonRes.onclick = function () {window.location.href = url;}
    homeButtonRes.onclick = function () {window.location.href = "/";}

    topFace.addEventListener("click", function () {
        this.blur();
        if (box.classList.contains("open-top")) {
            answerSection.style.display = "none";
            answerText.style.color="black";
            answerText.innerText = "Click the box!";
            if(ask_index<ask_line){
                setTimeout(() => {
                    document.getElementById('box').classList.add('shake');
                }, 400);
            }
            box.classList.remove("open-top");
        }
        else {
            answerSection.style.display = "flex";
            setTimeout(() => {
                document.getElementById('box').classList.remove('shake');
            }, 100);
            if (ask_index < ask_line) {
                submitAnswerButton.disabled = false;
                box.classList.toggle("open-top");
                createAsk();
            }
            else {
                submitAnswerButton.disabled = true;
            }
        }
    });
    speakButton.addEventListener('click', () => {
        isMuted = !isMuted;
            if (isMuted) {
                speakButton.classList.remove("fa-volume-up");
                speakButton.classList.add("fa-volume-mute");
            } else {
                speakButton.classList.remove("fa-volume-mute");
                speakButton.classList.add("fa-volume-up");
            }
    });

    function createAsk() {
        topFace.classList.add("disabled");
        ask_index++;
        let randomIndex;

        do {
            randomIndex = Math.floor(Math.random() * words.length);
        } while (randomWords.includes(randomIndex));

        currentWord = words[randomIndex];
        randomWords.push(randomIndex);
        askEnglish = Math.random() > 0.5;
        answerText.innerText = "";
        progressContainer.style.display = "flex";

        if (askEnglish) {
            paper.textContent = currentWord.turkish;
        } else {
            paper.textContent = currentWord.english;
        }
        paper.addEventListener('transitionend',  function () {
            if (askEnglish) {
                questionText.textContent = `What is the English translation of "${currentWord.turkish}"?`;
            } else {
                questionText.textContent = `What is the Turkish translation of "${currentWord.english}"?`;
            }
        }, { once: true });
        if (!isMuted) {
            setTimeout(() => {
                if (askEnglish) {
                    speakText(currentWord.turkish, 'tr-TR');
                } else {
                    speakText(currentWord.english, 'en-GB');
                }
            }, 500);
        }
    }
    
    function speakText(text, language) {
        let utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    }

    submitAnswerButton.addEventListener("click", function () {
        submitAnswerButton.disabled = true;
        window.scrollTo(0, 0);
        let isCorrect = false;
        const answer = userAnswer.value.trim().toLocaleLowerCase('tr-TR');
        let correctAnswer = askEnglish ? currentWord.english.toLowerCase() : currentWord.turkish.toLowerCase();     
        let correctAnswers = [correctAnswer];
        if (askEnglish) {
            if (currentWord.other_english) {
                correctAnswers = correctAnswers.concat(currentWord.other_english.split(',').map(s => s.trim().toLowerCase()));
            }
            const tr = document.createElement('tr');
            const tdAsk = document.createElement('td');
            const tdAnswer = document.createElement('td');
            tdAsk.textContent=currentWord.turkish;
            tdAnswer.textContent = correctAnswers.join(', ');
            tr.appendChild(tdAsk);
            tr.appendChild(tdAnswer);
            resultList.appendChild(tr); 
        } else {
            if (currentWord.other_turkish) {
                correctAnswers = correctAnswers.concat(currentWord.other_turkish.split(',').map(s => s.trim().toLowerCase()));
            }
            const tr = document.createElement('tr');
            const tdAsk = document.createElement('td');
            const tdAnswer = document.createElement('td');
            tdAsk.textContent=currentWord.english;
            tdAnswer.textContent = correctAnswers.join(', ');
            tr.appendChild(tdAsk);
            tr.appendChild(tdAnswer);
            resultList.appendChild(tr); 
        }
        if (correctAnswers.includes(answer)) {
            answerText.innerText = "Correct Answer!";
            answerText.style.color = green_color;
            correctNum++;
            isCorrect = true;
        } else {
            answerText.innerText = correctAnswer;
            answerText.style.color = red_color;
            isCorrect = false;
        }
        updateProgress(isCorrect);
        setTimeout(() => {
            userAnswer.value = "";
            answerText.innerText = "";
            questionText.innerText = "";
            topFace.classList.remove("disabled");
            topFace.click();
        }, 1700);
    });
    
    function updateProgress(isCorrect) {
        if (progress < 100) {
            progress += 100 / ask_line;
            const segment = document.createElement('div');
            segment.classList.add('progress-segment');
            segment.style.width = (100 / ask_line) + '%';
            segment.style.backgroundColor = isCorrect ? green_color : red_color;
            progressContainer.appendChild(segment);
            if (progress >= 100) {
                shareCard.style.display="none";
                showGameResult(correctNum, ask_line);
            }
        }
    }

    userAnswer.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            if(userAnswer.innerText!==null){
                submitAnswerButton.click();
            }
        }
    });

    const url = `${window.location.origin}${window.location.pathname}`;
    const text = encodeURIComponent('Hadi bakalım!Özenle hazırlanmış bu kelime kutusunda kaç puan alıcaksın 😊');

    document.getElementById('whatsappShareBtn').addEventListener('click', () => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const baseUrl = isMobile ? 'https://api.whatsapp.com/send?text=' : 'https://web.whatsapp.com/send?text=';
        window.open(`${baseUrl}${text} ${url}`, '_blank');
    });

    document.getElementById('copyLinkBtn').addEventListener('click', () => {
        navigator.clipboard.writeText(url).catch(err => {
            console.error('Link kopyalanırken bir hata oluştu: ', err);
        });
    });

    document.querySelectorAll('.share-btn').forEach(button => {
        button.addEventListener('click', () => {
            button.classList.add('temp-color');
            setTimeout(() => {
                button.classList.remove('temp-color');
            }, 2500);
        });
    });
});