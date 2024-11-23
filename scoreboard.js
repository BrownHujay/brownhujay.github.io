let scores = [];


document.addEventListener("DOMContentLoaded", function() {
    
    fetch("https://brownhujay.pythonanywhere.com/scoreboard/get")
        .then(response => response.json())
        .then(userData => {
            console.log(userData);
            for(let i=0; i<userData.length; i++) {
                scores.push({name: userData[i]['name'], score: userData[i]['score']});
            }
        updateLeaderboardView();
        })
});



function updateLeaderboardView() {
    let leaderboard = document.getElementById("leaderboard");
    leaderboard.innerHTML = "";

    scores.sort(function(a, b){ return b.score - a.score}); //JS sort is weird where it needs a function to sort :( 
    let elements = []; // created elements to update score

    // create elements for each player
    for(let i=0; i<scores.length; i++) {
        let name = document.createElement("div"); //create a div for name
        let score = document.createElement("div"); //create a div for score
        
        name.classList.add("name"); //add the class names and stuff
        score.classList.add("score");
        name.innerText = scores[i].name; //give the div it's info
        score.innerText = scores[i].score;

        let scoreRow = document.createElement("div"); //cerate the row to hold other info
        scoreRow.classList.add("row"); //label it
        scoreRow.appendChild(name); // give info to div
        scoreRow.appendChild(score);
        leaderboard.appendChild(scoreRow);

        elements.push(scoreRow); //add div to array.

    }

    let colors = ["gold", "silver", "#cd7f32"];
    for(let i=0; i < Math.min(3, elements.length); i++) {
        elements[i].style.color = colors[i]; // for the first three in list (top 3 scores because previously sorted)
    }
}


