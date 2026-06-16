// script.js

// SVGs for placeholders
const svgRed = `<svg class="svg-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <!-- Graffiti/Pencil style X -->
    <path d="M 20,20 Q 50,45 80,80 M 15,25 Q 50,50 85,75 M 80,20 Q 50,45 20,80 M 85,15 Q 50,50 15,75" stroke="#111" stroke-width="8" stroke-linecap="round" fill="none" style="filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.3));" />
</svg>`;

const svgBlue = `<svg class="svg-icon" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <!-- Graffiti/Pencil style O -->
    <path d="M 50,15 C 80,15 85,50 80,80 C 70,100 20,90 15,60 C 10,20 40,10 60,18" stroke="#111" stroke-width="8" stroke-linecap="round" fill="none" style="filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.3));" />
    <path d="M 55,20 C 85,20 90,55 85,85 C 75,105 25,95 20,65 C 15,25 45,15 65,23" stroke="#111" stroke-width="6" stroke-linecap="round" fill="none" />
</svg>`;

// We will inject the SVGs into the score icons
document.getElementById('icon-player-score').innerHTML = svgRed;
document.getElementById('icon-ai-score').innerHTML = svgBlue;

const userPlayer = 'X'; // Red
const aiPlayer = 'O'; // Blue

let board = Array(9).fill(null);
let currentPlayer = userPlayer;
let roundCycle = 0; // 0,1,2,3
let gameActive = false;
let scores = { player: 0, draw: 0, ai: 0 };

const winCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

const boardEl = document.getElementById('board');
const turnIndicator = document.getElementById('turn-indicator');

// --- Text Type Animation Logic (Vanilla JS port of React Bits Component) ---
const introTexts = [
    "Did you know?",
    " Tic-Tac-Toe is mathematically  solved so  you never lose?",
    "Play four quick rounds and unlock the secret",
    "Ready?"
];

let introTextIndex = 0;
let introCharIndex = 0;
let introIsDeleting = false;
const typingSpeed = 40;
const deletingSpeed = 20;
const pauseDuration = 1800;

function runTextType() {
    const contentEl = document.getElementById('text-type-content');
    if (!contentEl) return;
    
    const currentText = introTexts[introTextIndex];

    if (introIsDeleting) {
        contentEl.textContent = currentText.substring(0, introCharIndex - 1);
        introCharIndex--;
        
        if (introCharIndex === 0) {
            introIsDeleting = false;
            introTextIndex++;
            if (introTextIndex >= introTexts.length) return; // Sequence done
            setTimeout(runTextType, 500); // Pause before next word starts typing
        } else {
            setTimeout(runTextType, deletingSpeed);
        }
    } else {
        contentEl.textContent = currentText.substring(0, introCharIndex + 1);
        introCharIndex++;
        
        if (introCharIndex === currentText.length) {
            if (introTextIndex === introTexts.length - 1) {
                // Last text ("Ready?") finished typing, do not delete, trigger transition
                setTimeout(transitionToGame, 1000);
            } else {
                introIsDeleting = true;
                setTimeout(runTextType, pauseDuration);
            }
        } else {
            setTimeout(runTextType, typingSpeed);
        }
    }
}

function transitionToGame() {
    const introContainer = document.getElementById('intro-container');
    const gameContainer = document.getElementById('game-container');
    
    introContainer.classList.add('opacity-0'); // Fade out typing text
    
    setTimeout(() => {
        introContainer.classList.add('pointer-events-none');
        gameContainer.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
        gameContainer.classList.add('opacity-100', 'scale-100'); // Fade in and scale up game
        
        // Start the game logic shortly after fade-in starts
        setTimeout(() => {
            startGame();
        }, 600);
    }, 1000);
}
// --- Landing Page Animation Logic ---
function animateLandingPage() {
    const titleEl = document.getElementById('landing-title');
    const subtitleEl = document.getElementById('landing-subtitle');
    const bottomRightEl = document.getElementById('landing-bottom-right');
    const textContentEl = document.getElementById('landing-text-content');
    const textCursorEl = document.getElementById('landing-text-cursor');
    
    if (!titleEl || !subtitleEl) return;

    // Split text into spans for each character to mimic SplitText behavior
    const text = titleEl.textContent;
    titleEl.innerHTML = '';
    
    const chars = [];
    for (let i = 0; i < text.length; i++) {
        const span = document.createElement('span');
        span.textContent = text[i];
        span.style.display = 'inline-block';
        span.style.willChange = 'transform, opacity';
        titleEl.appendChild(span);
        chars.push(span);
    }
    
    // Initial state: Title is 1.5x larger, centered, subtitle hidden
    gsap.set(titleEl, { scale: 1.5, transformOrigin: "center center" });

    // Animate letters in using the React Bits elastic settings
    gsap.fromTo(chars, 
        { opacity: 0, y: 40 },
        {
            opacity: 1,
            y: 0,
            duration: 3, // Increased from 2 to slow it down
            ease: "elastic.out(1, 0.3)",
            stagger: 0.25, // Increased from 0.11 to 0.25 for a longer delay between letters
            onComplete: () => {
                // Once title letters are done animating, shrink title to normal size
                gsap.to(titleEl, {
                    scale: 1,
                    duration: 1.5, // Increased from 1 to 1.5 for a smoother/slower shrink
                    ease: "power3.inOut",
                    onComplete: () => {
                        // Start the typing animation for the subtitle
                        if (textCursorEl) {
                            textCursorEl.classList.remove('hidden');
                            // Blink cursor
                            gsap.to(textCursorEl, {
                                opacity: 0,
                                duration: 0.5,
                                repeat: -1,
                                yoyo: true,
                                ease: 'power2.inOut'
                            });
                        }

                        const sequenceData = [
                            { text: "We're compiling all our projects", blackStart: 24, blackEnd: 32 },
                            { text: "The website will be live in a few days", blackStart: -1, blackEnd: -1 },
                            { text: "Until then...", blackStart: -1, blackEnd: -1 },
                            { text: "If you want to learn something interesting", blackStart: 15, blackEnd: 30 },
                            { text: "Click below", blackStart: 0, blackEnd: 5 }
                        ];
                        const loopText = "Beyond Parallel Assumptions";
                        
                        let textIndex = 0;
                        let charIndex = 0;
                        let isDeleting = false;
                        let isLooping = false;
                        
                        function getFormattedText(fullText, charIdx, blackStart, blackEnd) {
                            const currentStr = fullText.substring(0, charIdx);
                            if (blackStart === -1 || charIdx <= blackStart) {
                                return currentStr;
                            }
                            const beforeBlack = fullText.substring(0, blackStart);
                            const inBlack = fullText.substring(blackStart, Math.min(charIdx, blackEnd));
                            const afterBlack = charIdx > blackEnd ? fullText.substring(blackEnd, charIdx) : "";
                            
                            return beforeBlack + '<span style="color: black; -webkit-text-stroke: 0.25px #fff;">' + inBlack + '</span>' + afterBlack;
                        }
                        
                        function typeLandingText() {
                            if (!textContentEl) return;
                            
                            const currentObj = isLooping ? { text: loopText, blackStart: -1, blackEnd: -1 } : sequenceData[textIndex];
                            const currentText = currentObj.text;
                            
                            // We removed the font change logic here because it's now applied to the parent div in HTML.
                            if (isLooping) {
                                textContentEl.style.webkitTextStroke = "0px";
                            } else {
                                textContentEl.style.webkitTextStroke = "0.25px #000"; // Restore border
                            }
                            
                            if (isDeleting) {
                                textContentEl.innerHTML = getFormattedText(currentText, charIndex - 1, currentObj.blackStart, currentObj.blackEnd);
                                charIndex--;
                                
                                if (charIndex === 0) {
                                    isDeleting = false;
                                    if (!isLooping) {
                                        textIndex++;
                                        if (textIndex >= sequenceData.length) {
                                            isLooping = true;
                                        }
                                    }
                                    setTimeout(typeLandingText, 500); // Pause before typing next
                                } else {
                                    setTimeout(typeLandingText, 30); // Deleting speed
                                }
                            } else {
                                textContentEl.innerHTML = getFormattedText(currentText, charIndex + 1, currentObj.blackStart, currentObj.blackEnd);
                                charIndex++;
                                
                                if (charIndex === currentText.length) {
                                    if (!isLooping && textIndex === sequenceData.length - 1) {
                                        // Finished typing "Click below"
                                        if (bottomRightEl && bottomRightEl.classList.contains('opacity-0')) {
                                            gsap.to(bottomRightEl, {
                                                opacity: 1,
                                                duration: 1.5,
                                                ease: "power2.out",
                                                onStart: () => {
                                                    bottomRightEl.classList.remove('pointer-events-none');
                                                }
                                            });
                                        }
                                        isDeleting = true;
                                        setTimeout(typeLandingText, 2500); // Wait so user sees arrow and text
                                    } else if (isLooping) {
                                        isDeleting = true;
                                        setTimeout(typeLandingText, 3000); // Wait on final text loop
                                    } else {
                                        isDeleting = true;
                                        setTimeout(typeLandingText, 1500); // Wait on normal texts
                                    }
                                } else {
                                    setTimeout(typeLandingText, 50); // Typing speed
                                }
                            }
                        }
                        
                        // Small pause before typing starts
                        setTimeout(typeLandingText, 300);
                    }
                });
            }
        }
    );
}

// --------------------------------------------------------------------------

function init() {
    createBoard();
    updateScoreUI();
    
    // Start landing page intro animation
    animateLandingPage();
    
    // GSAP Cursor Blinking Animation
    gsap.set('#text-type-cursor', { opacity: 1 });
    gsap.to('#text-type-cursor', {
        opacity: 0,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
    });

    const playBtn = document.getElementById('play-game-btn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            const landingPage = document.getElementById('landing-page');
            landingPage.classList.add('opacity-0', 'pointer-events-none');
            
            // Show the game footer marquee
            const gameFooter = document.getElementById('game-footer-marquee');
            if (gameFooter) {
                gameFooter.classList.remove('opacity-0', 'pointer-events-none');
                gameFooter.classList.add('opacity-100');
            }

            setTimeout(() => {
                landingPage.style.display = 'none';
                // Start text typing intro sequence
                setTimeout(runTextType, 500);
            }, 1000); // Wait for fade out
        });
    } else {
        // Start text typing intro sequence
        setTimeout(runTextType, 1000);
    }
}

function createBoard() {
    boardEl.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.index = i;
        cell.addEventListener('click', handleCellClick);
        boardEl.appendChild(cell);
    }
}

function updateTurnIndicator() {
    if (!turnIndicator) return;
    
    turnIndicator.classList.remove('text-red-500', 'text-blue-500', 'text-white');
    if (!gameActive) {
        turnIndicator.classList.add('text-white');
        turnIndicator.classList.remove('turn-pulse');
        return;
    }
    
    turnIndicator.classList.add('turn-pulse');
    if (currentPlayer === userPlayer) {
        turnIndicator.textContent = "Your Turn";
        turnIndicator.classList.add('text-red-500');
    } else {
        turnIndicator.textContent = "AI Computing...";
        turnIndicator.classList.add('text-blue-500');
    }
}

function startGame() {
    board = Array(9).fill(null);
    gameActive = true;
    boardEl.classList.remove('board-finished');
    
    // Clean up cells and win lines
    document.querySelectorAll('.cell').forEach(cell => {
        cell.innerHTML = '';
        cell.classList.remove('occupied', 'winner');
    });
    const oldLine = document.querySelector('.win-line');
    if (oldLine) oldLine.remove();

    // Determine starting player based on round cycle (0,1,2,3)
    if (roundCycle === 1 || roundCycle === 3) {
        currentPlayer = aiPlayer;
        updateTurnIndicator();
        setTimeout(aiMove, 800);
    } else {
        currentPlayer = userPlayer;
        updateTurnIndicator();
    }
}

function handleCellClick(e) {
    if (!gameActive || currentPlayer !== userPlayer) return;
    
    const index = e.target.closest('.cell').dataset.index;
    if (board[index] !== null) return;
    
    makeMove(index, userPlayer);
    
    if (gameActive) {
        currentPlayer = aiPlayer;
        updateTurnIndicator();
        setTimeout(aiMove, 600 + Math.random() * 400); // Slight random delay for realism
    }
}

function makeMove(index, player) {
    board[index] = player;
    
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    cell.classList.add('occupied');
    
    const token = document.createElement('div');
    token.className = `token ${player === userPlayer ? 'red-icon' : 'blue-icon'}`;
    token.innerHTML = player === userPlayer ? svgRed : svgBlue;
    cell.appendChild(token);
    
    const winCombo = checkWin(board, player);
    if (winCombo) {
        endGame(player, winCombo);
    } else if (!board.includes(null)) {
        endGame('draw');
    }
}

function aiMove() {
    if (!gameActive) return;
    
    let emptySpots = board.filter(s => s === null).length;
    
    // Optimal first move for AI if AI goes first
    if (emptySpots === 9) {
        const options = [0, 2, 4, 6, 8]; // Corners + Center
        const choice = options[Math.floor(Math.random() * options.length)];
        makeMove(choice, aiPlayer);
    } 
    // Response to user playing Center on turn 1
    else if (emptySpots === 8 && board[4] === userPlayer) {
        const corners = [0, 2, 6, 8];
        const choice = corners[Math.floor(Math.random() * corners.length)];
        makeMove(choice, aiPlayer);
    } 
    else {
        // Minimax
        const bestMove = minimax(board, aiPlayer, 0, -10000, 10000);
        makeMove(bestMove.index, aiPlayer);
    }
    
    if (gameActive) {
        currentPlayer = userPlayer;
        updateTurnIndicator();
    }
}

// Minimax algorithm with alpha-beta pruning and depth evaluation
function minimax(newBoard, player, depth, alpha, beta) {
    let availSpots = [];
    for (let i = 0; i < 9; i++) {
        if (newBoard[i] === null) availSpots.push(i);
    }

    if (checkWin(newBoard, userPlayer)) return { score: -10 + depth };
    if (checkWin(newBoard, aiPlayer)) return { score: 10 - depth };
    if (availSpots.length === 0) return { score: 0 };

    let moves = [];
    
    // Optimization: Shuffle available spots to add variety in equal choices
    availSpots.sort(() => Math.random() - 0.5);

    for (let i = 0; i < availSpots.length; i++) {
        let move = {};
        move.index = availSpots[i];
        newBoard[availSpots[i]] = player;

        if (player === aiPlayer) {
            let result = minimax(newBoard, userPlayer, depth + 1, alpha, beta);
            move.score = result.score;
            alpha = Math.max(alpha, move.score);
        } else {
            let result = minimax(newBoard, aiPlayer, depth + 1, alpha, beta);
            move.score = result.score;
            beta = Math.min(beta, move.score);
        }

        newBoard[availSpots[i]] = null;
        moves.push(move);
        
        // Alpha-Beta Pruning
        if (beta <= alpha) break;
    }

    let bestMove;
    if (player === aiPlayer) {
        let bestScore = -10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        let bestScore = 10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }
    
    // In case of break from pruning, we might not have evaluated all moves, but the best one so far is sufficient
    return moves[bestMove];
}

function checkWin(boardState, player) {
    for (let combo of winCombos) {
        if (boardState[combo[0]] === player && 
            boardState[combo[1]] === player && 
            boardState[combo[2]] === player) {
            return combo;
        }
    }
    return null;
}

function endGame(winner, combo = null) {
    gameActive = false;
    boardEl.classList.add('board-finished');
    
    if (turnIndicator) {
        if (winner === userPlayer) {
            turnIndicator.textContent = "You Win! (Wait, how?!)";
        } else if (winner === aiPlayer) {
            turnIndicator.textContent = "AI Wins.";
        } else {
            turnIndicator.textContent = "Draw.";
        }
    }
    
    if (winner === userPlayer) {
        scores.player++;
    } else if (winner === aiPlayer) {
        scores.ai++;
    } else {
        scores.draw++;
    }
    
    updateScoreUI();
    
    if (combo) {
        combo.forEach(index => {
            document.querySelector(`.cell[data-index="${index}"]`).classList.add('winner');
        });
        drawWinLine(combo);
    }
    
    // Cycle rounds and restart
    roundCycle = (roundCycle + 1) % 4;
    setTimeout(startGame, 3000);
}

function updateScoreUI() {
    document.getElementById('score-player').textContent = scores.player;
    document.getElementById('score-draw').textContent = scores.draw;
    document.getElementById('score-ai').textContent = scores.ai;
}

function drawWinLine(combo) {
    const line = document.createElement('div');
    line.className = 'win-line';
    
    const comboStr = combo.join(',');
    
    if (comboStr === '0,1,2') line.classList.add('win-line-h');
    else if (comboStr === '3,4,5') line.classList.add('win-line-h', 'row-1');
    else if (comboStr === '6,7,8') line.classList.add('win-line-h', 'row-2');
    
    else if (comboStr === '0,3,6') line.classList.add('win-line-v');
    else if (comboStr === '1,4,7') line.classList.add('win-line-v', 'col-1');
    else if (comboStr === '2,5,8') line.classList.add('win-line-v', 'col-2');
    
    else if (comboStr === '0,4,8') line.classList.add('win-line-d1');
    else if (comboStr === '2,4,6') line.classList.add('win-line-d2');
    
    boardEl.appendChild(line);
}

// Start game when page loads
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
        init();
    });
} else {
    // Fallback if document.fonts is not supported
    window.addEventListener('load', init);
}

// --- Video Hover Logic ---
const videoContainer = document.getElementById('video-hover-container');
const hoverVideo = document.getElementById('hover-video');

if (videoContainer && hoverVideo) {
    let isPlaying = false;

    // Play the video manually on hover
    videoContainer.addEventListener('mouseenter', () => {
        if (!isPlaying) {
            isPlaying = true;
            // The browser might block play() if it's not loaded, ensure we catch promise rejections
            const playPromise = hoverVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Video playback failed:", error);
                    isPlaying = false;
                });
            }
        }
    });

    hoverVideo.addEventListener('ended', () => {
        isPlaying = false;
        hoverVideo.currentTime = 0; // Reset for next hover
    });
    
    // Explicitly load the video so the first frame is ready
    hoverVideo.load();
}
