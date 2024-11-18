//beautiful stack overflow code :)
let scores = [];


document.addEventListener("DOMContentLoaded", function() {
    // Fetch the IP address from the API
    fetch("https://api.ipify.org?format=json")
        .then(response => response.json())
        .then(ip => {
            console.log(ip.ip);
        })
        .catch(error => {
            console.error("Error fetching IP address:", error);
        });
    
    fetch("http://127.0.0.1:5000/scoreboard/get")
        .then(response => response.json())
        .then(userData => {
            console.log(userData);
            for(let i=0; i<userData.length; i++) {
                scores.push({name: userData[i]['name'], score: userData[i]['score']});
            }
        console.log(JSON.stringify(scores));
        updateLeaderboardView();
        })
});



function updateLeaderboardView() {
    let leaderboard = document.getElementById("leaderboard");
    leaderboard.innerHTML = "";

    scores.sort(function(a, b){ return b.score - a.score  });
    let elements = []; // we'll need created elements to update colors later on
    // create elements for each player
    for(let i=0; i<scores.length; i++) {
        let name = document.createElement("div");
        let score = document.createElement("div");
        name.classList.add("name");
        score.classList.add("score");
        name.innerText = scores[i].name;
        score.innerText = scores[i].score;

        let scoreRow = document.createElement("div");
        scoreRow.classList.add("row");
        scoreRow.appendChild(name);
        scoreRow.appendChild(score);
        leaderboard.appendChild(scoreRow);

        elements.push(scoreRow);

    }

    let colors = ["gold", "silver", "#cd7f32"];
    for(let i=0; i < Math.min(3, elements.length); i++) {
        elements[i].style.color = colors[i];
    }
}



function randomize() {
    for(var i=0; i<scores.length; i++) {
        scores[i].score = Math.floor(Math.random() * (600 - 300 + 1)) + 300;
    }
    // when your data changes, call updateLeaderboardView
    updateLeaderboardView();
}